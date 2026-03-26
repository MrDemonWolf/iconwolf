import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { extractIconFolder } from './icon-extract.js';

export async function createTempDir(): Promise<string> {
  const dir = path.join(os.tmpdir(), `iconwolf-${crypto.randomUUID()}`);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function saveUploadedFile(
  file: File,
  tempDir: string,
  prefix = '',
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = path.join(tempDir, `${prefix}${safeName}`);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

export async function resolveInputPath(
  savedPath: string,
  tempDir: string,
  subdir = 'icon',
): Promise<string> {
  // If it's a ZIP, extract and look for .icon folder
  if (savedPath.endsWith('.zip')) {
    const extractDir = path.join(tempDir, `${subdir}-extracted`);
    const iconFolder = await extractIconFolder(savedPath, extractDir);
    return iconFolder;
  }
  // Otherwise treat as PNG
  return savedPath;
}
