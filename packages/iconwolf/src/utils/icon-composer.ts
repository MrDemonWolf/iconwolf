import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import type { BannerOptions, GenerationResult } from '../types.js';
import { createBannerSvg, resolveColor } from './banner.js';

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

interface IconComposerFillSpecialization {
  appearance?: string;
  value: IconComposerFill;
}

interface IconComposerManifest {
  fill?: IconComposerFill;
  'fill-specializations'?: IconComposerFillSpecialization[];
  groups: IconComposerGroup[];
  'supported-platforms'?: unknown;
}

export interface IconComposerResult {
  composedImagePath: string;
  foregroundImagePath: string;
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
function parseIconColor(color: string): {
  r: number;
  g: number;
  b: number;
  a: number;
} {
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
  orientation: {
    start: { x: number; y: number };
    stop: { x: number; y: number };
  },
  size: number,
): string {
  const parsedColors = colors.map(parseIconColor);
  const x1 = (orientation.start.x * 100).toFixed(1);
  const y1 = (orientation.start.y * 100).toFixed(1);
  const x2 = (orientation.stop.x * 100).toFixed(1);
  const y2 = (orientation.stop.y * 100).toFixed(1);

  const stops = parsedColors
    .map((c, i) => {
      const offset =
        parsedColors.length === 1 ? 0 : (i / (parsedColors.length - 1)) * 100;
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
async function createBackground(
  fill: IconComposerFill,
): Promise<{ buffer: Buffer; bgColor: string }> {
  if (fill['linear-gradient'] && fill.orientation) {
    const colors = fill['linear-gradient'];
    const svg = createGradientSvg(colors, fill.orientation, ICON_SIZE);
    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
    const firstColor = parseIconColor(colors[0]);
    return {
      buffer,
      bgColor: rgbToHex(firstColor.r, firstColor.g, firstColor.b),
    };
  }

  const solidColor = fill.solid ?? fill.color;
  if (solidColor) {
    const color = parseIconColor(solidColor);
    const buffer = await sharp({
      create: {
        width: ICON_SIZE,
        height: ICON_SIZE,
        channels: 4,
        background: {
          r: color.r,
          g: color.g,
          b: color.b,
          alpha: Math.round(color.a * 255),
        },
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
export async function renderIconComposerFolder(
  iconFolderPath: string,
): Promise<IconComposerResult> {
  const manifestPath = path.join(iconFolderPath, 'icon.json');
  const assetsPath = path.join(iconFolderPath, 'Assets');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`icon.json not found in ${iconFolderPath}`);
  }

  const manifestRaw = fs.readFileSync(manifestPath, 'utf-8');
  const manifest: IconComposerManifest = JSON.parse(manifestRaw);

  // Resolve fill: prefer top-level `fill`, fall back to first `fill-specializations` entry (light appearance)
  const fill: IconComposerFill =
    manifest.fill ??
    manifest['fill-specializations']?.find((s) => !s.appearance)?.value ??
    manifest['fill-specializations']?.[0]?.value ??
    {};

  // Create background
  const { buffer: backgroundBuffer, bgColor: extractedBgColor } =
    await createBackground(fill);

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
        throw new Error(
          `Cannot read dimensions of layer: ${layer['image-name']}`,
        );
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
      if (
        left < 0 ||
        top < 0 ||
        left + scaledWidth > ICON_SIZE ||
        top + scaledHeight > ICON_SIZE
      ) {
        const cropLeft = Math.max(0, -left);
        const cropTop = Math.max(0, -top);
        const cropRight = Math.min(scaledWidth, ICON_SIZE - left);
        const cropBottom = Math.min(scaledHeight, ICON_SIZE - top);
        const cropWidth = cropRight - cropLeft;
        const cropHeight = cropBottom - cropTop;

        if (cropWidth <= 0 || cropHeight <= 0) continue;

        layerBuffer = await sharp(layerBuffer)
          .extract({
            left: cropLeft,
            top: cropTop,
            width: cropWidth,
            height: cropHeight,
          })
          .png()
          .toBuffer();
        left = Math.max(0, left);
        top = Math.max(0, top);
      }

      compositeOps.push({ input: layerBuffer, left, top });
    }
  }

  // Compose final image (with background)
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'iconwolf-compose-'));
  const composedPath = path.join(tmpDir, 'composed-icon.png');

  await sharp(backgroundBuffer)
    .composite(compositeOps)
    .png()
    .toFile(composedPath);

  // Compose foreground-only image (transparent background) for splash
  const foregroundPath = path.join(tmpDir, 'foreground-icon.png');

  const transparentBg = await sharp({
    create: {
      width: ICON_SIZE,
      height: ICON_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer();

  await sharp(transparentBg)
    .composite(compositeOps)
    .png()
    .toFile(foregroundPath);

  return {
    composedImagePath: composedPath,
    foregroundImagePath: foregroundPath,
    extractedBgColor,
  };
}

/**
 * Convert a hex color string (#RRGGBB or #RGB) to the sRGB format used in icon.json.
 * Returns e.g. "srgb:0.03529,0.08235,0.20000,1.00000"
 */
export function hexToIconColor(hex: string): string {
  const cleaned = hex.replace(/^#/, '');

  let r: number, g: number, b: number;

  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else if (cleaned.length === 6) {
    r = parseInt(cleaned.slice(0, 2), 16);
    g = parseInt(cleaned.slice(2, 4), 16);
    b = parseInt(cleaned.slice(4, 6), 16);
  } else {
    throw new Error(`Invalid hex color: ${hex}. Use #RGB or #RRGGBB format.`);
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    throw new Error(`Invalid hex color: ${hex}. Contains non-hex characters.`);
  }

  const rf = (r / 255).toFixed(5);
  const gf = (g / 255).toFixed(5);
  const bf = (b / 255).toFixed(5);

  return `srgb:${rf},${gf},${bf},1.00000`;
}

/**
 * Create an Apple Icon Composer .icon folder from a PNG input.
 * Generates the folder structure with icon.json manifest and Assets/ directory.
 */
export async function createIconComposerFolder(
  inputPath: string,
  outputPath: string,
  options: { bgColor: string; darkBgColor?: string; banner?: BannerOptions },
): Promise<GenerationResult> {
  const assetsDir = path.join(outputPath, 'Assets');
  fs.mkdirSync(assetsDir, { recursive: true });

  // Copy input PNG to Assets/foreground.png
  const foregroundDest = path.join(assetsDir, 'foreground.png');
  fs.copyFileSync(inputPath, foregroundDest);

  // Build icon.json manifest
  const lightColor = hexToIconColor(options.bgColor);

  const layers: Array<{
    'image-name': string;
    name: string;
    position: {
      scale: number;
      'translation-in-points': [number, number];
    };
  }> = [
    {
      'image-name': 'foreground.png',
      name: 'foreground',
      position: {
        scale: 1.0,
        'translation-in-points': [0, 0],
      },
    },
  ];

  // Generate banner layer if requested
  let bannerSize = 0;
  if (options.banner) {
    const bannerColor = resolveColor(options.banner.text, options.banner.color);
    const position = options.banner.position ?? 'top-left';
    const svg = createBannerSvg(
      ICON_SIZE,
      options.banner.text,
      bannerColor,
      position,
    );
    const bannerDest = path.join(assetsDir, 'banner.png');
    await sharp(Buffer.from(svg)).png().toFile(bannerDest);
    bannerSize = fs.statSync(bannerDest).size;

    layers.push({
      'image-name': 'banner.png',
      name: 'banner',
      position: {
        scale: 1.0,
        'translation-in-points': [0, 0],
      },
    });
  }

  const group = { layers };

  let manifest: Record<string, unknown>;

  if (options.darkBgColor) {
    const darkColor = hexToIconColor(options.darkBgColor);
    manifest = {
      'fill-specializations': [
        { value: { solid: lightColor } },
        { appearance: 'dark', value: { solid: darkColor } },
      ],
      groups: [group],
      'supported-platforms': { squares: 'shared' },
    };
  } else {
    manifest = {
      fill: { solid: lightColor },
      groups: [group],
      'supported-platforms': { squares: 'shared' },
    };
  }

  const manifestPath = path.join(outputPath, 'icon.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  // Calculate folder size
  const foregroundSize = fs.statSync(foregroundDest).size;
  const manifestSize = fs.statSync(manifestPath).size;

  return {
    filePath: outputPath,
    width: ICON_SIZE,
    height: ICON_SIZE,
    size: foregroundSize + manifestSize + bannerSize,
  };
}
