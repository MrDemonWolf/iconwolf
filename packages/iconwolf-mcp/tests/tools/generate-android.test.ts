import fs from 'node:fs';
import { describe, it, expect, afterEach } from 'vitest';
import { handleGenerateAndroid } from '../../src/tools/generate-android.js';
import { createTestPng, createTmpDir, cleanDir } from '../helpers.js';

const dirsToClean: string[] = [];

afterEach(() => {
  for (const dir of dirsToClean) {
    cleanDir(dir);
  }
  dirsToClean.length = 0;
});

describe('handleGenerateAndroid', () => {
  it('generates android adaptive icons with background', async () => {
    const tmpDir = createTmpDir();
    dirsToClean.push(tmpDir);
    const inputPath = await createTestPng(1024, 1024, tmpDir);
    const outputDir = tmpDir + '/output';

    const result = await handleGenerateAndroid({
      file_path: inputPath,
      output_dir: outputDir,
      bg_color: '#FF6B35',
      include_background: true,
    });

    expect(result.content.length).toBeGreaterThanOrEqual(2);
    const metadata = JSON.parse(
      (result.content[0] as { type: 'text'; text: string }).text,
    );
    expect(metadata.success).toBe(true);
    expect(metadata.totalFiles).toBe(3);
    for (const file of metadata.files) {
      expect(fs.existsSync(file.file)).toBe(true);
    }
  });

  it('generates only foreground when include_background is false', async () => {
    const tmpDir = createTmpDir();
    dirsToClean.push(tmpDir);
    const inputPath = await createTestPng(1024, 1024, tmpDir);
    const outputDir = tmpDir + '/output';

    const result = await handleGenerateAndroid({
      file_path: inputPath,
      output_dir: outputDir,
      bg_color: '#FFFFFF',
      include_background: false,
    });

    const metadata = JSON.parse(
      (result.content[0] as { type: 'text'; text: string }).text,
    );
    expect(metadata.success).toBe(true);
    expect(metadata.totalFiles).toBe(1);
  });
});
