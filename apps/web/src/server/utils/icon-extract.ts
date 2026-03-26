import fs from 'fs/promises';
import path from 'path';
import { createReadStream } from 'fs';
import unzipper from 'unzipper';

export async function extractIconFolder(
  zipPath: string,
  extractDir: string,
): Promise<string> {
  await fs.mkdir(extractDir, { recursive: true });

  await new Promise<void>((resolve, reject) => {
    createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractDir }))
      .on('close', resolve)
      .on('error', reject);
  });

  // Find the .icon folder (may be at root or nested one level)
  const iconFolder = await findIconFolder(extractDir);
  if (!iconFolder) {
    throw new Error(
      'No .icon folder found in ZIP. Upload a ZIP containing an Apple Icon Composer .icon folder.',
    );
  }

  return iconFolder;
}

async function findIconFolder(dir: string, depth = 0): Promise<string | null> {
  if (depth > 2) return null;

  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.endsWith('.icon')) {
      const iconJsonPath = path.join(dir, entry.name, 'icon.json');
      try {
        await fs.access(iconJsonPath);
        return path.join(dir, entry.name);
      } catch {
        // .icon folder without icon.json, skip
      }
    }
  }

  // Search one level deeper
  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      const found = await findIconFolder(path.join(dir, entry.name), depth + 1);
      if (found) return found;
    }
  }

  return null;
}
