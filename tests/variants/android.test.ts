import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateAndroidIcons } from '../../src/variants/android.js';
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

describe('generateAndroidIcons', () => {
  it('generates only foreground by default', async () => {
    const outDir = path.join(tmpDir, 'fg-only');
    fs.mkdirSync(outDir);
    const results = await generateAndroidIcons(testPng, outDir, '#FFFFFF');

    expect(results).toHaveLength(1);
    expect(results[0].width).toBe(1024);
    expect(results[0].height).toBe(1024);
    expect(fs.existsSync(results[0].filePath)).toBe(true);
    expect(path.basename(results[0].filePath)).toBe('adaptive-icon.png');
  });

  it('generates 3 android icon files with includeBackground', async () => {
    const outDir = path.join(tmpDir, 'all-android');
    fs.mkdirSync(outDir);
    const results = await generateAndroidIcons(testPng, outDir, '#FFFFFF', {
      includeBackground: true,
    });

    expect(results).toHaveLength(3);

    for (const result of results) {
      expect(result.width).toBe(1024);
      expect(result.height).toBe(1024);
      expect(fs.existsSync(result.filePath)).toBe(true);
    }
  });

  it('names files correctly', async () => {
    const outDir = path.join(tmpDir, 'names');
    fs.mkdirSync(outDir);
    const results = await generateAndroidIcons(testPng, outDir, '#FFFFFF', {
      includeBackground: true,
    });
    const names = results.map((r) => path.basename(r.filePath));

    expect(names).toContain('adaptive-icon.png');
    expect(names).toContain('android-icon-background.png');
    expect(names).toContain('monochrome-icon.png');
  });

  it('background uses the specified color', async () => {
    const outDir = path.join(tmpDir, 'bg-color');
    fs.mkdirSync(outDir);
    const results = await generateAndroidIcons(testPng, outDir, '#FF0000', {
      includeBackground: true,
    });
    const bgResult = results.find((r) => r.filePath.includes('background'));

    expect(bgResult).toBeDefined();
    const { channels } = await sharp(bgResult!.filePath).stats();
    // channels[0]=R, [1]=G, [2]=B - check mean values for solid color
    expect(channels[0].mean).toBeCloseTo(255, -1);
    expect(channels[1].mean).toBeCloseTo(0, -1);
    expect(channels[2].mean).toBeCloseTo(0, -1);
  });
});
