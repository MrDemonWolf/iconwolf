import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'iconwolf-mcp-'));
}

export function cleanTempDir(dirPath: string): void {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

export function writeBase64ToFile(
  base64Data: string,
  outputPath: string,
): void {
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(outputPath, buffer);
}

export function readFileAsBase64(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return buffer.toString('base64');
}

export function resolveInputPath(
  filePath?: string,
  base64Image?: string,
  tempDir?: string,
): { inputPath: string; tempDir: string } {
  const dir = tempDir ?? createTempDir();

  if (filePath) {
    return { inputPath: path.resolve(filePath), tempDir: dir };
  }

  if (base64Image) {
    const inputPath = path.join(dir, 'input.png');
    writeBase64ToFile(base64Image, inputPath);
    return { inputPath, tempDir: dir };
  }

  throw new Error('Either file_path or base64_image must be provided');
}
