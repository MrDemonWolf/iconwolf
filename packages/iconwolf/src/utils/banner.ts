import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import type {
  BannerOptions,
  BannerPosition,
  GenerationResult,
} from '../types.js';

const DEFAULT_COLORS: Record<string, string> = {
  DEV: '#4CAF50',
  BETA: '#FF9800',
  STAGING: '#2196F3',
  ALPHA: '#9C27B0',
};

const FALLBACK_COLOR = '#F44336';

export function resolveColor(text: string, color?: string): string {
  if (color) return color;
  return DEFAULT_COLORS[text.toUpperCase()] ?? FALLBACK_COLOR;
}

export function createBannerSvg(
  size: number,
  text: string,
  color: string,
  position: BannerPosition,
): string {
  const ribbonWidth = Math.round(size * 0.42);
  const ribbonHeight = Math.round(size * 0.08);
  const fontSize = Math.round(ribbonHeight * 0.6);
  const halfDiag = ribbonWidth / 2;

  // Center of the ribbon in each corner
  let cx: number;
  let cy: number;
  let angle: number;

  switch (position) {
    case 'top-left':
      cx = size * 0.2;
      cy = size * 0.2;
      angle = -45;
      break;
    case 'top-right':
      cx = size * 0.8;
      cy = size * 0.2;
      angle = 45;
      break;
    case 'bottom-left':
      cx = size * 0.2;
      cy = size * 0.8;
      angle = 45;
      break;
    case 'bottom-right':
      cx = size * 0.8;
      cy = size * 0.8;
      angle = -45;
      break;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <g transform="translate(${cx}, ${cy}) rotate(${angle})">
    <rect x="${-halfDiag}" y="${-ribbonHeight / 2}" width="${ribbonWidth}" height="${ribbonHeight}" fill="${color}"/>
    <text x="0" y="0" text-anchor="middle" dominant-baseline="central"
      font-family="Arial, Helvetica, sans-serif" font-weight="bold"
      font-size="${fontSize}" fill="white">${escapeXml(text)}</text>
  </g>
</svg>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function applyBanner(
  result: GenerationResult,
  bannerOptions: BannerOptions,
): Promise<void> {
  const color = resolveColor(bannerOptions.text, bannerOptions.color);
  const position = bannerOptions.position ?? 'top-left';

  const meta = await sharp(result.filePath).metadata();
  const size = meta.width ?? 1024;

  const svg = createBannerSvg(size, bannerOptions.text, color, position);
  const svgBuffer = Buffer.from(svg);

  const tmpPath = result.filePath + '.tmp';

  await sharp(result.filePath)
    .composite([{ input: svgBuffer, top: 0, left: 0 }])
    .png()
    .toFile(tmpPath);

  fs.renameSync(tmpPath, result.filePath);

  const stat = fs.statSync(result.filePath);
  result.size = stat.size;
}

/** Files that should not receive a banner overlay. */
const SKIP_FILES = new Set([
  'favicon.png',
  'android-icon-background.png',
  'monochrome-icon.png',
]);

export function shouldApplyBanner(filePath: string): boolean {
  return !SKIP_FILES.has(path.basename(filePath));
}
