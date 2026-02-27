import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, afterEach } from 'vitest';
import {
  createTempDir,
  cleanTempDir,
  writeBase64ToFile,
  readFileAsBase64,
  resolveInputPath,
} from '../../src/utils/io.js';

const dirsToClean: string[] = [];

afterEach(() => {
  for (const dir of dirsToClean) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  dirsToClean.length = 0;
});

describe('createTempDir', () => {
  it('creates a temporary directory', () => {
    const dir = createTempDir();
    dirsToClean.push(dir);
    expect(fs.existsSync(dir)).toBe(true);
    expect(fs.statSync(dir).isDirectory()).toBe(true);
  });
});

describe('cleanTempDir', () => {
  it('removes a directory and its contents', () => {
    const dir = createTempDir();
    const file = path.join(dir, 'test.txt');
    fs.writeFileSync(file, 'hello');
    cleanTempDir(dir);
    expect(fs.existsSync(dir)).toBe(false);
  });
});

describe('writeBase64ToFile / readFileAsBase64', () => {
  it('round-trips data through base64', () => {
    const dir = createTempDir();
    dirsToClean.push(dir);
    const filePath = path.join(dir, 'test.bin');
    const originalData = 'Hello, World!';
    const base64 = Buffer.from(originalData).toString('base64');

    writeBase64ToFile(base64, filePath);
    expect(fs.existsSync(filePath)).toBe(true);

    const readBack = readFileAsBase64(filePath);
    expect(Buffer.from(readBack, 'base64').toString()).toBe(originalData);
  });
});

describe('resolveInputPath', () => {
  it('resolves a file_path directly', () => {
    const dir = createTempDir();
    dirsToClean.push(dir);
    const result = resolveInputPath('/some/path.png', undefined, dir);
    expect(result.inputPath).toBe('/some/path.png');
    expect(result.tempDir).toBe(dir);
  });

  it('writes base64 to a temp file', () => {
    const base64 = Buffer.from('test data').toString('base64');
    const result = resolveInputPath(undefined, base64);
    dirsToClean.push(result.tempDir);
    expect(fs.existsSync(result.inputPath)).toBe(true);
    expect(result.inputPath).toContain('input.png');
  });

  it('throws when neither file_path nor base64_image provided', () => {
    expect(() => resolveInputPath(undefined, undefined)).toThrow(
      'Either file_path or base64_image must be provided',
    );
  });
});
