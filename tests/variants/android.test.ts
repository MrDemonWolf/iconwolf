import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateAndroidIcons } from '../../src/variants/android.js';
import { createTestPng, createTmpDir, cleanDir } from '../helpers.js';

let tmpDir: string;
let outDir: string;
let testPng: string;

beforeAll(async () => {
  tmpDir = createTmpDir();
  outDir = path.join(tmpDir, 'output');
  fs.mkdirSync(outDir);
  testPng = await createTestPng(1024, 1024, tmpDir);
});

afterAll(() => {
  cleanDir(tmpDir);
});

describe('generateAndroidIcons', () => {
  it('generates 3 android icon files', async () => {
    const results = await generateAndroidIcons(testPng, outDir, '#FFFFFF');

    expect(results).toHaveLength(3);

    for (const result of results) {
      expect(result.width).toBe(1024);
      expect(result.height).toBe(1024);
      expect(fs.existsSync(result.filePath)).toBe(true);
    }
  });

  it('names files correctly', async () => {
    const results = await generateAndroidIcons(testPng, outDir, '#FFFFFF');
    const names = results.map((r) => path.basename(r.filePath));

    expect(names).toContain('android-icon-foreground.png');
    expect(names).toContain('android-icon-background.png');
    expect(names).toContain('android-icon-monochrome.png');
  });

  it('background uses the specified color', async () => {
    const results = await generateAndroidIcons(testPng, outDir, '#FF0000');
    const bgResult = results.find((r) => r.filePath.includes('background'));

    expect(bgResult).toBeDefined();
    const { channels } = await sharp(bgResult!.filePath).stats();
    // channels[0]=R, [1]=G, [2]=B - check mean values for solid color
    expect(channels[0].mean).toBeCloseTo(255, -1);
    expect(channels[1].mean).toBeCloseTo(0, -1);
    expect(channels[2].mean).toBeCloseTo(0, -1);
  });
});
