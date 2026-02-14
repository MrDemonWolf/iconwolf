import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

export async function createTestPng(
  width: number,
  height: number,
  dir?: string,
): Promise<string> {
  const tmpDir =
    dir ?? fs.mkdtempSync(path.join(os.tmpdir(), 'iconwolf-test-'));
  const filePath = path.join(tmpDir, 'test-icon.png');

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 107, b: 53, alpha: 255 },
    },
  })
    .png()
    .toFile(filePath);

  return filePath;
}

export function createTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'iconwolf-test-'));
}

export function cleanDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}
