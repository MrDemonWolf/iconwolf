import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateStandardIcon } from '../../src/variants/standard.js';
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

describe('generateStandardIcon', () => {
  it('generates icon.png at 1024x1024', async () => {
    const result = await generateStandardIcon(testPng, outDir);

    expect(result.width).toBe(1024);
    expect(result.height).toBe(1024);
    expect(result.filePath).toContain('icon.png');
    expect(fs.existsSync(result.filePath)).toBe(true);

    const meta = await sharp(result.filePath).metadata();
    expect(meta.format).toBe('png');
  });
});
