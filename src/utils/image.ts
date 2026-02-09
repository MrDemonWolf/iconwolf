import sharp from 'sharp';
import type { GenerationResult } from '../types.js';

const ADAPTIVE_ICON_SIZE = 1024;
const SAFE_ZONE_RATIO = 66 / 108;
const SAFE_ZONE_PX = Math.round(ADAPTIVE_ICON_SIZE * SAFE_ZONE_RATIO);

export interface SourceImageMeta {
  width: number;
  height: number;
  format: string;
}

export async function validateSourceImage(inputPath: string): Promise<SourceImageMeta> {
  const metadata = await sharp(inputPath).metadata();

  if (!metadata.format || metadata.format !== 'png') {
    throw new Error(`Source image must be a PNG file (got ${metadata.format || 'unknown'})`);
  }

  if (!metadata.width || !metadata.height) {
    throw new Error('Could not read image dimensions');
  }

  if (metadata.width !== metadata.height) {
    throw new Error(
      `Source image must be square (got ${metadata.width}x${metadata.height})`,
    );
  }

  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
  };
}

export async function resizeImage(
  inputPath: string,
  width: number,
  height: number,
  outputPath: string,
): Promise<GenerationResult> {
  const info = await sharp(inputPath)
    .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outputPath);

  return {
    filePath: outputPath,
    width: info.width,
    height: info.height,
    size: info.size,
  };
}

export async function createAdaptiveForeground(
  inputPath: string,
  targetSize: number,
  outputPath: string,
): Promise<GenerationResult> {
  const artwork = await sharp(inputPath)
    .resize(SAFE_ZONE_PX, SAFE_ZONE_PX, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const margin = Math.round((targetSize - SAFE_ZONE_PX) / 2);

  const info = await sharp({
    create: {
      width: targetSize,
      height: targetSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: artwork, left: margin, top: margin }])
    .png()
    .toFile(outputPath);

  return {
    filePath: outputPath,
    width: info.width,
    height: info.height,
    size: info.size,
  };
}

export async function createSolidBackground(
  hexColor: string,
  size: number,
  outputPath: string,
): Promise<GenerationResult> {
  const { r, g, b } = parseHexColor(hexColor);

  const info = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r, g, b, alpha: 255 },
    },
  })
    .png()
    .toFile(outputPath);

  return {
    filePath: outputPath,
    width: info.width,
    height: info.height,
    size: info.size,
  };
}

export async function createMonochromeIcon(
  inputPath: string,
  targetSize: number,
  outputPath: string,
): Promise<GenerationResult> {
  const artwork = await sharp(inputPath)
    .resize(SAFE_ZONE_PX, SAFE_ZONE_PX, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .grayscale()
    .png()
    .toBuffer();

  const margin = Math.round((targetSize - SAFE_ZONE_PX) / 2);

  const info = await sharp({
    create: {
      width: targetSize,
      height: targetSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: artwork, left: margin, top: margin }])
    .png()
    .toFile(outputPath);

  return {
    filePath: outputPath,
    width: info.width,
    height: info.height,
    size: info.size,
  };
}

/**
 * Apply rounded corners to an image using an SVG mask.
 * Uses Apple's icon corner radius ratio (~22.37%).
 */
export async function applyRoundedCorners(
  inputBuffer: Buffer,
  size: number,
): Promise<Buffer> {
  const radius = Math.round(size * 0.2237);
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/></svg>`,
  );

  return sharp(inputBuffer)
    .resize(size, size)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

export function parseHexColor(hex: string): { r: number; g: number; b: number } {
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

  return { r, g, b };
}
