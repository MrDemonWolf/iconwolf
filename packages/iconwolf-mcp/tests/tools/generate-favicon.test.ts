import fs from 'node:fs';
import { describe, it, expect, afterEach } from 'vitest';
import { handleGenerateFavicon } from '../../src/tools/generate-favicon.js';
import { createTestPng, createTmpDir, cleanDir } from '../helpers.js';

const dirsToClean: string[] = [];

afterEach(() => {
  for (const dir of dirsToClean) {
    cleanDir(dir);
  }
  dirsToClean.length = 0;
});

describe('handleGenerateFavicon', () => {
  it('generates 48x48 favicon from file_path', async () => {
    const tmpDir = createTmpDir();
    dirsToClean.push(tmpDir);
    const inputPath = await createTestPng(1024, 1024, tmpDir);
    const outputDir = tmpDir + '/output';

    const result = await handleGenerateFavicon({
      file_path: inputPath,
      output_dir: outputDir,
    });

    expect(result.content).toHaveLength(2);
    const metadata = JSON.parse(
      (result.content[0] as { type: 'text'; text: string }).text,
    );
    expect(metadata.success).toBe(true);
    expect(metadata.width).toBe(48);
    expect(metadata.height).toBe(48);
    expect(fs.existsSync(metadata.file)).toBe(true);
  });
});
