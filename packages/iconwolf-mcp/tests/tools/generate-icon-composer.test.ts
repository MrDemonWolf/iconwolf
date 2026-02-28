import fs from 'node:fs';
import { describe, it, expect, afterEach } from 'vitest';
import { handleGenerateIconComposer } from '../../src/tools/generate-icon-composer.js';
import {
  createTestPng,
  createTestPngBase64,
  createTmpDir,
  cleanDir,
} from '../helpers.js';

const dirsToClean: string[] = [];

afterEach(() => {
  for (const dir of dirsToClean) {
    cleanDir(dir);
  }
  dirsToClean.length = 0;
});

describe('handleGenerateIconComposer', () => {
  it('generates .icon folder from file_path', async () => {
    const tmpDir = createTmpDir();
    dirsToClean.push(tmpDir);
    const inputPath = await createTestPng(1024, 1024, tmpDir);
    const outputDir = tmpDir + '/AppIcon.icon';

    const result = await handleGenerateIconComposer({
      file_path: inputPath,
      output_dir: outputDir,
      bg_color: '#FF0000',
    });

    expect(result.content).toHaveLength(2);
    expect(result.content[0].type).toBe('text');

    const metadata = JSON.parse(
      (result.content[0] as { type: 'text'; text: string }).text,
    );
    expect(metadata.success).toBe(true);
    expect(metadata.width).toBe(1024);
    expect(metadata.height).toBe(1024);
    expect(fs.existsSync(metadata.folder)).toBe(true);
    expect(metadata.manifest.fill.solid).toBe(
      'srgb:1.00000,0.00000,0.00000,1.00000',
    );

    expect(result.content[1].type).toBe('image');
  });

  it('generates .icon folder from base64_image', async () => {
    const tmpDir = createTmpDir();
    dirsToClean.push(tmpDir);
    const base64 = await createTestPngBase64(1024, 1024);
    const outputDir = tmpDir + '/Base64Icon.icon';

    const result = await handleGenerateIconComposer({
      base64_image: base64,
      output_dir: outputDir,
      bg_color: '#FFFFFF',
    });

    expect(result.content).toHaveLength(2);
    const metadata = JSON.parse(
      (result.content[0] as { type: 'text'; text: string }).text,
    );
    expect(metadata.success).toBe(true);
    expect(fs.existsSync(outputDir)).toBe(true);
  });

  it('generates .icon folder with banner layer', async () => {
    const tmpDir = createTmpDir();
    dirsToClean.push(tmpDir);
    const inputPath = await createTestPng(1024, 1024, tmpDir);
    const outputDir = tmpDir + '/BannerIcon.icon';

    const result = await handleGenerateIconComposer({
      file_path: inputPath,
      output_dir: outputDir,
      bg_color: '#FF0000',
      banner: { text: 'BETA' },
    });

    const metadata = JSON.parse(
      (result.content[0] as { type: 'text'; text: string }).text,
    );
    expect(metadata.success).toBe(true);
    expect(metadata.manifest.groups[0].layers).toHaveLength(2);
    expect(metadata.manifest.groups[0].layers[1].name).toBe('banner');
    expect(fs.existsSync(outputDir + '/Assets/banner.png')).toBe(true);
  });

  it('generates fill-specializations with dark_bg_color', async () => {
    const tmpDir = createTmpDir();
    dirsToClean.push(tmpDir);
    const inputPath = await createTestPng(1024, 1024, tmpDir);
    const outputDir = tmpDir + '/DarkIcon.icon';

    const result = await handleGenerateIconComposer({
      file_path: inputPath,
      output_dir: outputDir,
      bg_color: '#FFFFFF',
      dark_bg_color: '#000000',
    });

    const metadata = JSON.parse(
      (result.content[0] as { type: 'text'; text: string }).text,
    );
    expect(metadata.success).toBe(true);
    expect(metadata.manifest['fill-specializations']).toHaveLength(2);
    expect(metadata.manifest['fill-specializations'][0].value.solid).toBe(
      'srgb:1.00000,1.00000,1.00000,1.00000',
    );
    expect(metadata.manifest['fill-specializations'][1].appearance).toBe(
      'dark',
    );
    expect(metadata.manifest['fill-specializations'][1].value.solid).toBe(
      'srgb:0.00000,0.00000,0.00000,1.00000',
    );
  });
});
