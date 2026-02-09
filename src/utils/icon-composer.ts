import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';

const ICON_SIZE = 1024;

interface IconComposerFill {
  'linear-gradient'?: string[];
  solid?: string;
  color?: string;
  orientation?: {
    start: { x: number; y: number };
    stop: { x: number; y: number };
  };
}

interface IconComposerLayer {
  'image-name': string;
  name: string;
  position: {
    scale: number;
    'translation-in-points': [number, number];
  };
}

interface IconComposerGroup {
  layers: IconComposerLayer[];
  shadow?: { kind: string; opacity: number };
  translucency?: { enabled: boolean; value: number };
}

interface IconComposerManifest {
  fill: IconComposerFill;
  groups: IconComposerGroup[];
  'supported-platforms'?: unknown;
}

export interface IconComposerResult {
  composedImagePath: string;
  extractedBgColor: string;
}

/**
 * Check if a path is an Apple Icon Composer .icon folder.
 */
export function isIconComposerFolder(inputPath: string): boolean {
  if (!inputPath.endsWith('.icon')) return false;
  try {
    const stat = fs.statSync(inputPath);
    if (!stat.isDirectory()) return false;
    return fs.existsSync(path.join(inputPath, 'icon.json'));
  } catch {
    return false;
  }
}

/**
 * Parse a color string from icon.json to sRGB values.
 * Supports formats: "display-p3:R,G,B,A" and "srgb:R,G,B,A" (values 0-1).
 */
function parseIconColor(color: string): { r: number; g: number; b: number; a: number } {
  const match = color.match(/^[\w-]+:([\d.]+),([\d.]+),([\d.]+),([\d.]+)$/);
  if (!match) {
    throw new Error(`Unsupported color format: ${color}`);
  }

  return {
    r: Math.round(parseFloat(match[1]) * 255),
    g: Math.round(parseFloat(match[2]) * 255),
    b: Math.round(parseFloat(match[3]) * 255),
    a: parseFloat(match[4]),
  };
}

/**
 * Convert RGB values to hex string.
 */
function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((c) => c.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

/**
 * Create an SVG string for a linear gradient background.
 */
function createGradientSvg(
  colors: string[],
  orientation: { start: { x: number; y: number }; stop: { x: number; y: number } },
  size: number,
): string {
  const parsedColors = colors.map(parseIconColor);
  const x1 = (orientation.start.x * 100).toFixed(1);
  const y1 = (orientation.start.y * 100).toFixed(1);
  const x2 = (orientation.stop.x * 100).toFixed(1);
  const y2 = (orientation.stop.y * 100).toFixed(1);

  const stops = parsedColors
    .map((c, i) => {
      const offset = parsedColors.length === 1 ? 0 : (i / (parsedColors.length - 1)) * 100;
      return `<stop offset="${offset}%" stop-color="rgb(${c.r},${c.g},${c.b})" stop-opacity="${c.a}" />`;
    })
    .join('\n      ');

  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
      ${stops}
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)" />
</svg>`;
}

/**
 * Create the background buffer from the icon.json fill definition.
 */
async function createBackground(fill: IconComposerFill): Promise<{ buffer: Buffer; bgColor: string }> {
  if (fill['linear-gradient'] && fill.orientation) {
    const colors = fill['linear-gradient'];
    const svg = createGradientSvg(colors, fill.orientation, ICON_SIZE);
    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
    const firstColor = parseIconColor(colors[0]);
    return { buffer, bgColor: rgbToHex(firstColor.r, firstColor.g, firstColor.b) };
  }

  const solidColor = fill.solid ?? fill.color;
  if (solidColor) {
    const color = parseIconColor(solidColor);
    const buffer = await sharp({
      create: {
        width: ICON_SIZE,
        height: ICON_SIZE,
        channels: 4,
        background: { r: color.r, g: color.g, b: color.b, alpha: Math.round(color.a * 255) },
      },
    })
      .png()
      .toBuffer();
    return { buffer, bgColor: rgbToHex(color.r, color.g, color.b) };
  }

  // Fallback: white background
  const buffer = await sharp({
    create: {
      width: ICON_SIZE,
      height: ICON_SIZE,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 255 },
    },
  })
    .png()
    .toBuffer();
  return { buffer, bgColor: '#FFFFFF' };
}

/**
 * Render an Apple Icon Composer .icon folder into a composed 1024x1024 PNG.
 * Returns the path to the composed image and the extracted background color.
 */
export async function renderIconComposerFolder(iconFolderPath: string): Promise<IconComposerResult> {
  const manifestPath = path.join(iconFolderPath, 'icon.json');
  const assetsPath = path.join(iconFolderPath, 'Assets');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`icon.json not found in ${iconFolderPath}`);
  }

  const manifestRaw = fs.readFileSync(manifestPath, 'utf-8');
  const manifest: IconComposerManifest = JSON.parse(manifestRaw);

  // Create background
  const { buffer: backgroundBuffer, bgColor: extractedBgColor } = await createBackground(manifest.fill);

  // Build composite operations for each layer
  const compositeOps: sharp.OverlayOptions[] = [];

  for (const group of manifest.groups) {
    for (const layer of group.layers) {
      const imagePath = path.join(assetsPath, layer['image-name']);
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Layer image not found: ${imagePath}`);
      }

      const meta = await sharp(imagePath).metadata();
      if (!meta.width || !meta.height) {
        throw new Error(`Cannot read dimensions of layer: ${layer['image-name']}`);
      }

      // Scale relative to original image size
      const scaledWidth = Math.round(meta.width * layer.position.scale);
      const scaledHeight = Math.round(meta.height * layer.position.scale);

      // Center on canvas with translation offset (in points/pixels)
      const tx = layer.position['translation-in-points'][0];
      const ty = layer.position['translation-in-points'][1];
      let left = Math.round((ICON_SIZE - scaledWidth) / 2 + tx);
      let top = Math.round((ICON_SIZE - scaledHeight) / 2 + ty);

      let layerBuffer = await sharp(imagePath)
        .resize(scaledWidth, scaledHeight, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      // If the layer extends beyond the canvas, crop to visible region
      if (left < 0 || top < 0 || left + scaledWidth > ICON_SIZE || top + scaledHeight > ICON_SIZE) {
        const cropLeft = Math.max(0, -left);
        const cropTop = Math.max(0, -top);
        const cropRight = Math.min(scaledWidth, ICON_SIZE - left);
        const cropBottom = Math.min(scaledHeight, ICON_SIZE - top);
        const cropWidth = cropRight - cropLeft;
        const cropHeight = cropBottom - cropTop;

        if (cropWidth <= 0 || cropHeight <= 0) continue;

        layerBuffer = await sharp(layerBuffer)
          .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
          .png()
          .toBuffer();
        left = Math.max(0, left);
        top = Math.max(0, top);
      }

      compositeOps.push({ input: layerBuffer, left, top });
    }
  }

  // Compose final image
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'iconwolf-compose-'));
  const composedPath = path.join(tmpDir, 'composed-icon.png');

  await sharp(backgroundBuffer).composite(compositeOps).png().toFile(composedPath);

  return {
    composedImagePath: composedPath,
    extractedBgColor,
  };
}
