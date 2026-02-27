import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateFavicon } from '../../src/variants/favicon.js';
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

describe('generateFavicon', () => {
  it('generates favicon.png at 48x48', async () => {
    const result = await generateFavicon(testPng, outDir);

    expect(result.width).toBe(48);
    expect(result.height).toBe(48);
    expect(result.filePath).toContain('favicon.png');
    expect(fs.existsSync(result.filePath)).toBe(true);

    const meta = await sharp(result.filePath).metadata();
    expect(meta.format).toBe('png');
    expect(meta.width).toBe(48);
  });
});
