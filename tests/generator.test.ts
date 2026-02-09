import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generate } from '../src/generator.js';
import { OUTPUT_FILES } from '../src/utils/paths.js';
import { createTestPng, createTmpDir, cleanDir } from './helpers.js';

let tmpDir: string;
let testPng: string;

beforeAll(async () => {
  tmpDir = createTmpDir();
  testPng = await createTestPng(1024, 1024, tmpDir);
});

afterAll(() => {
  cleanDir(tmpDir);
});

describe('generate', () => {
  it('generates all 6 files when no flags set', async () => {
    const outDir = path.join(tmpDir, 'all');

    await generate({
      inputPath: testPng,
      outputDir: outDir,
      variants: { android: false, favicon: false, splash: false, icon: false },
      bgColor: '#FFFFFF',
    });

    const allFiles = Object.values(OUTPUT_FILES);
    for (const file of allFiles) {
      expect(fs.existsSync(path.join(outDir, file))).toBe(true);
    }
  });

  it('generates only icon when --icon flag set', async () => {
    const outDir = path.join(tmpDir, 'icon-only');

    await generate({
      inputPath: testPng,
      outputDir: outDir,
      variants: { android: false, favicon: false, splash: false, icon: true },
      bgColor: '#FFFFFF',
    });

    expect(fs.existsSync(path.join(outDir, 'icon.png'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'favicon.png'))).toBe(false);
    expect(fs.existsSync(path.join(outDir, 'splash-icon.png'))).toBe(false);
    expect(fs.existsSync(path.join(outDir, 'android-icon-foreground.png'))).toBe(false);
  });

  it('generates only android files when --android flag set', async () => {
    const outDir = path.join(tmpDir, 'android-only');

    await generate({
      inputPath: testPng,
      outputDir: outDir,
      variants: { android: true, favicon: false, splash: false, icon: false },
      bgColor: '#FFFFFF',
    });

    expect(fs.existsSync(path.join(outDir, 'android-icon-foreground.png'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'android-icon-background.png'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'android-icon-monochrome.png'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'icon.png'))).toBe(false);
    expect(fs.existsSync(path.join(outDir, 'favicon.png'))).toBe(false);
  });

  it('throws on missing source file', async () => {
    const outDir = path.join(tmpDir, 'missing');

    await expect(
      generate({
        inputPath: '/tmp/does-not-exist.png',
        outputDir: outDir,
        variants: { android: false, favicon: false, splash: false, icon: false },
        bgColor: '#FFFFFF',
      }),
    ).rejects.toThrow('Source not found');
  });

  it('creates output directory if it does not exist', async () => {
    const outDir = path.join(tmpDir, 'nested', 'deep', 'dir');

    await generate({
      inputPath: testPng,
      outputDir: outDir,
      variants: { android: false, favicon: false, splash: false, icon: true },
      bgColor: '#FFFFFF',
    });

    expect(fs.existsSync(outDir)).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'icon.png'))).toBe(true);
  });
});
