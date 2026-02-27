import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CACHE_DIR = path.join(os.homedir(), '.iconwolf');
const CACHE_FILE = path.join(CACHE_DIR, 'update-check.json');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const FETCH_TIMEOUT_MS = 5000;
const RELEASES_URL =
  'https://api.github.com/repos/MrDemonWolf/iconwolf/releases/latest';

export interface UpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
}

interface CacheData {
  latestVersion: string;
  checkedAt: number;
}

export function isNewerVersion(current: string, latest: string): boolean {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);
  const len = Math.max(currentParts.length, latestParts.length);

  for (let i = 0; i < len; i++) {
    const c = currentParts[i] ?? 0;
    const l = latestParts[i] ?? 0;
    if (l > c) return true;
    if (l < c) return false;
  }

  return false;
}

export function readCachedUpdateInfo(
  currentVersion: string,
): UpdateInfo | null {
  try {
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
    const data: CacheData = JSON.parse(raw);
    if (!data.latestVersion) return null;

    return {
      updateAvailable: isNewerVersion(currentVersion, data.latestVersion),
      currentVersion,
      latestVersion: data.latestVersion,
    };
  } catch {
    return null;
  }
}

export async function refreshCacheInBackground(
  currentCacheFile?: string,
): Promise<void> {
  const cacheFile = currentCacheFile ?? CACHE_FILE;
  const cacheDir = path.dirname(cacheFile);

  try {
    // Check if cache is still fresh
    try {
      const stat = fs.statSync(cacheFile);
      if (Date.now() - stat.mtimeMs < CACHE_TTL_MS) return;
    } catch {
      // Cache missing, proceed with fetch
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(RELEASES_URL, {
        signal: controller.signal,
        headers: { Accept: 'application/vnd.github.v3+json' },
      });

      if (!res.ok) return;

      const body = (await res.json()) as { tag_name?: string };
      if (!body.tag_name) return;

      const latestVersion = body.tag_name.replace(/^v/, '');
      const cacheData: CacheData = {
        latestVersion,
        checkedAt: Date.now(),
      };

      fs.mkdirSync(cacheDir, { recursive: true });
      fs.writeFileSync(cacheFile, JSON.stringify(cacheData));
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    // Silently swallow all errors
  }
}
