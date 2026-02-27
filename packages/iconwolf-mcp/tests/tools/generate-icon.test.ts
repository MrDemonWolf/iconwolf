import fs from 'node:fs';
import { describe, it, expect, afterEach } from 'vitest';
import { handleGenerateIcon } from '../../src/tools/generate-icon.js';
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

describe('handleGenerateIcon', () => {
  it('generates icon from file_path', async () => {
    const tmpDir = createTmpDir();
    dirsToClean.push(tmpDir);
    const inputPath = await createTestPng(1024, 1024, tmpDir);
    const outputDir = tmpDir + '/output';

    const result = await handleGenerateIcon({
      file_path: inputPath,
      output_dir: outputDir,
    });

    expect(result.content).toHaveLength(2);
    expect(result.content[0].type).toBe('text');

    const metadata = JSON.parse(
      (result.content[0] as { type: 'text'; text: string }).text,
    );
    expect(metadata.success).toBe(true);
    expect(metadata.width).toBe(1024);
    expect(metadata.height).toBe(1024);
    expect(fs.existsSync(metadata.file)).toBe(true);

    expect(result.content[1].type).toBe('image');
  });

  it('generates icon from base64_image', async () => {
    const base64 = await createTestPngBase64(1024, 1024);

    const result = await handleGenerateIcon({
      base64_image: base64,
    });

    expect(result.content).toHaveLength(2);
    const metadata = JSON.parse(
      (result.content[0] as { type: 'text'; text: string }).text,
    );
    expect(metadata.success).toBe(true);
    expect(metadata.width).toBe(1024);
    expect(metadata.height).toBe(1024);
  });
});
