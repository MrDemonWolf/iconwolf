import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  parseHexColor,
  validateSourceImage,
  resizeImage,
  createAdaptiveForeground,
  createSolidBackground,
  createMonochromeIcon,
  applyRoundedCorners,
} from '../../src/utils/image.js';
import { createTestPng, createTmpDir, cleanDir } from '../helpers.js';

let tmpDir: string;
let testPng: string;

beforeAll(async () => {
  tmpDir = createTmpDir();
  testPng = await createTestPng(1024, 1024, tmpDir);
});

afterAll(() => {
  cleanDir(tmpDir);
});

describe('parseHexColor', () => {
  it('parses 6-digit hex with #', () => {
    expect(parseHexColor('#FF6B35')).toEqual({ r: 255, g: 107, b: 53 });
  });

  it('parses 6-digit hex without #', () => {
    expect(parseHexColor('FF6B35')).toEqual({ r: 255, g: 107, b: 53 });
  });

  it('parses 3-digit shorthand', () => {
    expect(parseHexColor('#FFF')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('parses black', () => {
    expect(parseHexColor('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('throws on invalid length', () => {
    expect(() => parseHexColor('#FFFFF')).toThrow('Invalid hex color');
  });

  it('throws on non-hex characters', () => {
    expect(() => parseHexColor('#GGGGGG')).toThrow('non-hex characters');
  });
});

describe('validateSourceImage', () => {
  it('accepts a valid square PNG', async () => {
    const meta = await validateSourceImage(testPng);
    expect(meta.width).toBe(1024);
    expect(meta.height).toBe(1024);
    expect(meta.format).toBe('png');
  });

  it('rejects non-square images', async () => {
    const rectPng = path.join(tmpDir, 'rect.png');
    await sharp({
      create: {
        width: 1024,
        height: 512,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 255 },
      },
    })
      .png()
      .toFile(rectPng);

    await expect(validateSourceImage(rectPng)).rejects.toThrow(
      'must be square',
    );
  });

  it('rejects non-PNG formats', async () => {
    const jpgFile = path.join(tmpDir, 'test.jpg');
    await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toFile(jpgFile);

    await expect(validateSourceImage(jpgFile)).rejects.toThrow('must be a PNG');
  });

  it('throws on missing file', async () => {
    await expect(validateSourceImage('/tmp/nonexistent.png')).rejects.toThrow();
  });
});

describe('resizeImage', () => {
  it('resizes to target dimensions', async () => {
    const output = path.join(tmpDir, 'resized.png');
    const result = await resizeImage(testPng, 48, 48, output);

    expect(result.width).toBe(48);
    expect(result.height).toBe(48);
    expect(result.size).toBeGreaterThan(0);
    expect(fs.existsSync(output)).toBe(true);
  });

  it('produces a valid PNG', async () => {
    const output = path.join(tmpDir, 'resized-check.png');
    await resizeImage(testPng, 256, 256, output);

    const meta = await sharp(output).metadata();
    expect(meta.format).toBe('png');
    expect(meta.width).toBe(256);
    expect(meta.height).toBe(256);
  });
});

describe('createAdaptiveForeground', () => {
  it('creates a 1024x1024 foreground with centered artwork', async () => {
    const output = path.join(tmpDir, 'foreground.png');
    const result = await createAdaptiveForeground(testPng, 1024, output);

    expect(result.width).toBe(1024);
    expect(result.height).toBe(1024);
    expect(fs.existsSync(output)).toBe(true);
  });
});

describe('createSolidBackground', () => {
  it('creates a solid color PNG', async () => {
    const output = path.join(tmpDir, 'bg.png');
    const result = await createSolidBackground('#FF0000', 1024, output);

    expect(result.width).toBe(1024);
    expect(result.height).toBe(1024);

    const meta = await sharp(output).metadata();
    expect(meta.format).toBe('png');
  });
});

describe('createMonochromeIcon', () => {
  it('creates a grayscale 1024x1024 icon', async () => {
    const output = path.join(tmpDir, 'mono.png');
    const result = await createMonochromeIcon(testPng, 1024, output);

    expect(result.width).toBe(1024);
    expect(result.height).toBe(1024);
    expect(fs.existsSync(output)).toBe(true);
  });
});

describe('applyRoundedCorners', () => {
  it('returns a PNG buffer with alpha channel', async () => {
    const input = await sharp({
      create: {
        width: 48,
        height: 48,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 255 },
      },
    })
      .png()
      .toBuffer();

    const result = await applyRoundedCorners(input, 48);
    const meta = await sharp(result).metadata();

    expect(meta.format).toBe('png');
    expect(meta.width).toBe(48);
    expect(meta.height).toBe(48);
    expect(meta.channels).toBe(4);
  });

  it('produces transparent corners', async () => {
    const input = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 255 },
      },
    })
      .png()
      .toBuffer();

    const result = await applyRoundedCorners(input, 100);
    const { data, info } = await sharp(result)
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Top-left corner pixel (0,0) should be transparent due to rounding
    const topLeftAlpha = data[3]; // RGBA, alpha is at index 3
    expect(topLeftAlpha).toBe(0);

    // Center pixel should be fully opaque
    const centerIdx =
      (Math.floor(info.height / 2) * info.width + Math.floor(info.width / 2)) *
      4;
    expect(data[centerIdx + 3]).toBe(255);
  });
});
