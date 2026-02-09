import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateSplashIcon } from '../../src/variants/splash.js';
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

describe('generateSplashIcon', () => {
  it('generates splash-icon.png at 1024x1024', async () => {
    const result = await generateSplashIcon(testPng, outDir);

    expect(result.width).toBe(1024);
    expect(result.height).toBe(1024);
    expect(result.filePath).toContain('splash-icon.png');
    expect(fs.existsSync(result.filePath)).toBe(true);

    const meta = await sharp(result.filePath).metadata();
    expect(meta.format).toBe('png');
  });
});
