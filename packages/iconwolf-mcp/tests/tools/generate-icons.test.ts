import fs from 'node:fs';
import { describe, it, expect, afterEach } from 'vitest';
import { handleGenerateIcons } from '../../src/tools/generate-icons.js';
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

describe('handleGenerateIcons', () => {
  it('generates all default variants from file_path', async () => {
    const tmpDir = createTmpDir();
    dirsToClean.push(tmpDir);
    const inputPath = await createTestPng(1024, 1024, tmpDir);
    const outputDir = tmpDir + '/output';

    const result = await handleGenerateIcons({
      file_path: inputPath,
      output_dir: outputDir,
      bg_color: '#FFFFFF',
    });

    const metadata = JSON.parse(
      (result.content[0] as { type: 'text'; text: string }).text,
    );
    expect(metadata.success).toBe(true);
    expect(metadata.totalFiles).toBe(4);
    for (const file of metadata.files) {
      expect(fs.existsSync(file.file)).toBe(true);
    }
  });

  it('generates all default variants from base64_image', async () => {
    const base64 = await createTestPngBase64(1024, 1024);

    const result = await handleGenerateIcons({
      base64_image: base64,
      bg_color: '#FFFFFF',
    });

    const metadata = JSON.parse(
      (result.content[0] as { type: 'text'; text: string }).text,
    );
    expect(metadata.success).toBe(true);
    expect(metadata.totalFiles).toBe(4);
  });

  it('generates only selected variants', async () => {
    const tmpDir = createTmpDir();
    dirsToClean.push(tmpDir);
    const inputPath = await createTestPng(1024, 1024, tmpDir);
    const outputDir = tmpDir + '/output';

    const result = await handleGenerateIcons({
      file_path: inputPath,
      output_dir: outputDir,
      bg_color: '#FFFFFF',
      variants: { icon: true, android: false, favicon: false, splash: false },
    });

    const metadata = JSON.parse(
      (result.content[0] as { type: 'text'; text: string }).text,
    );
    expect(metadata.success).toBe(true);
    expect(metadata.totalFiles).toBe(1);
  });
});
