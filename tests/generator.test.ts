import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generate } from '../src/generator.js';
import { OUTPUT_FILES } from '../src/utils/paths.js';
import { createTestPng, createTmpDir, cleanDir } from './helpers.js';

let tmpDir: string;
let testPng: string;
let testIconFolder: string;

async function createMockIconFolder(dir: string): Promise<string> {
  const iconDir = path.join(dir, 'Test.icon');
  const assetsDir = path.join(iconDir, 'Assets');
  fs.mkdirSync(assetsDir, { recursive: true });

  await sharp({
    create: { width: 200, height: 200, channels: 4, background: { r: 255, g: 107, b: 53, alpha: 255 } },
  })
    .png()
    .toFile(path.join(assetsDir, 'logo.png'));

  fs.writeFileSync(
    path.join(iconDir, 'icon.json'),
    JSON.stringify({
      fill: {
        'linear-gradient': [
          'display-p3:0.00000,0.67451,0.92941,1.00000',
          'display-p3:0.03529,0.08235,0.20000,1.00000',
        ],
        orientation: { start: { x: 0.5, y: 0 }, stop: { x: 0.5, y: 0.7 } },
      },
      groups: [
        {
          layers: [
            {
              'image-name': 'logo.png',
              name: 'logo',
              position: { scale: 1.0, 'translation-in-points': [0, 0] },
            },
          ],
        },
      ],
    }),
  );

  return iconDir;
}

beforeAll(async () => {
  tmpDir = createTmpDir();
  testPng = await createTestPng(1024, 1024, tmpDir);
  testIconFolder = await createMockIconFolder(tmpDir);
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

  it('generates all 6 files from .icon folder', async () => {
    const outDir = path.join(tmpDir, 'icon-composer');

    await generate({
      inputPath: testIconFolder,
      outputDir: outDir,
      variants: { android: false, favicon: false, splash: false, icon: false },
      bgColor: '#FFFFFF',
    });

    const allFiles = Object.values(OUTPUT_FILES);
    for (const file of allFiles) {
      expect(fs.existsSync(path.join(outDir, file))).toBe(true);
    }

    // Verify the composed icon is 1024x1024
    const meta = await sharp(path.join(outDir, 'icon.png')).metadata();
    expect(meta.width).toBe(1024);
    expect(meta.height).toBe(1024);
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
