import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createBannerSvg,
  applyBanner,
  shouldApplyBanner,
} from '../../src/utils/banner.js';
import { createTestPng, createTmpDir, cleanDir } from '../helpers.js';

let tmpDir: string;

beforeAll(() => {
  tmpDir = createTmpDir();
});

afterAll(() => {
  cleanDir(tmpDir);
});

describe('createBannerSvg', () => {
  it('generates valid SVG with correct dimensions', () => {
    const svg = createBannerSvg(1024, 'DEV', '#4CAF50', 'top-left');
    expect(svg).toContain('width="1024"');
    expect(svg).toContain('height="1024"');
    expect(svg).toContain('DEV');
    expect(svg).toContain('#4CAF50');
  });

  it('renders different positions', () => {
    const positions = [
      'top-left',
      'top-right',
      'bottom-left',
      'bottom-right',
    ] as const;

    for (const pos of positions) {
      const svg = createBannerSvg(1024, 'BETA', '#FF9800', pos);
      expect(svg).toContain('BETA');
      expect(svg).toContain('<svg');
    }
  });

  it('escapes XML characters in text', () => {
    const svg = createBannerSvg(1024, 'A&B<C>', '#FF0000', 'top-left');
    expect(svg).toContain('A&amp;B&lt;C&gt;');
  });

  it('scales ribbon proportionally to icon size', () => {
    const svg512 = createBannerSvg(512, 'DEV', '#4CAF50', 'top-left');
    const svg1024 = createBannerSvg(1024, 'DEV', '#4CAF50', 'top-left');
    expect(svg512).toContain('width="512"');
    expect(svg1024).toContain('width="1024"');
  });
});

describe('applyBanner', () => {
  it('composites banner onto a PNG file', async () => {
    const pngPath = await createTestPng(1024, 1024, tmpDir, 'banner-test.png');
    const originalSize = fs.statSync(pngPath).size;

    const result = { filePath: pngPath, width: 1024, height: 1024, size: originalSize };

    await applyBanner(result, { text: 'DEV' });

    expect(fs.existsSync(pngPath)).toBe(true);
    // The file should still be a valid PNG
    const meta = await sharp(pngPath).metadata();
    expect(meta.width).toBe(1024);
    expect(meta.height).toBe(1024);
    expect(meta.format).toBe('png');
    // Size in result should be updated
    expect(result.size).toBe(fs.statSync(pngPath).size);
  });

  it('uses custom color when provided', async () => {
    const pngPath = await createTestPng(1024, 1024, tmpDir, 'banner-custom-color.png');
    const result = { filePath: pngPath, width: 1024, height: 1024, size: fs.statSync(pngPath).size };

    await applyBanner(result, { text: 'TEST', color: '#FF00FF' });

    const meta = await sharp(pngPath).metadata();
    expect(meta.width).toBe(1024);
  });

  it('uses custom position', async () => {
    const pngPath = await createTestPng(1024, 1024, tmpDir, 'banner-pos.png');
    const result = { filePath: pngPath, width: 1024, height: 1024, size: fs.statSync(pngPath).size };

    await applyBanner(result, { text: 'DEV', position: 'bottom-right' });

    const meta = await sharp(pngPath).metadata();
    expect(meta.width).toBe(1024);
  });
});

describe('shouldApplyBanner', () => {
  it('returns true for icon.png', () => {
    expect(shouldApplyBanner('/out/icon.png')).toBe(true);
  });

  it('returns true for adaptive-icon.png', () => {
    expect(shouldApplyBanner('/out/adaptive-icon.png')).toBe(true);
  });

  it('returns true for splash-icon.png', () => {
    expect(shouldApplyBanner('/out/splash-icon.png')).toBe(true);
  });

  it('returns false for favicon.png', () => {
    expect(shouldApplyBanner('/out/favicon.png')).toBe(false);
  });

  it('returns false for android-icon-background.png', () => {
    expect(shouldApplyBanner('/out/android-icon-background.png')).toBe(false);
  });

  it('returns false for monochrome-icon.png', () => {
    expect(shouldApplyBanner('/out/monochrome-icon.png')).toBe(false);
  });
});
