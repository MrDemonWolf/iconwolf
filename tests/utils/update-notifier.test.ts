import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isNewerVersion,
  readCachedUpdateInfo,
  refreshCacheInBackground,
} from '../../src/utils/update-notifier.js';

describe('isNewerVersion', () => {
  it('returns true when latest patch is newer', () => {
    expect(isNewerVersion('0.0.6', '0.0.7')).toBe(true);
  });

  it('returns true when latest minor is newer', () => {
    expect(isNewerVersion('0.0.6', '0.1.0')).toBe(true);
  });

  it('returns true when latest major is newer', () => {
    expect(isNewerVersion('0.0.6', '1.0.0')).toBe(true);
  });

  it('returns false when versions are equal', () => {
    expect(isNewerVersion('0.0.6', '0.0.6')).toBe(false);
  });

  it('returns false when current is newer', () => {
    expect(isNewerVersion('0.0.7', '0.0.6')).toBe(false);
  });

  it('handles different segment lengths', () => {
    expect(isNewerVersion('1.0', '1.0.1')).toBe(true);
    expect(isNewerVersion('1.0.1', '1.0')).toBe(false);
  });
});

describe('readCachedUpdateInfo', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when cache file is missing', () => {
    vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('ENOENT');
    });
    expect(readCachedUpdateInfo('0.0.6')).toBeNull();
  });

  it('returns updateAvailable true when latest is newer', () => {
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({ latestVersion: '0.0.7', checkedAt: Date.now() }),
    );
    const result = readCachedUpdateInfo('0.0.6');
    expect(result).toEqual({
      updateAvailable: true,
      currentVersion: '0.0.6',
      latestVersion: '0.0.7',
    });
  });

  it('returns updateAvailable false when versions are equal', () => {
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({ latestVersion: '0.0.6', checkedAt: Date.now() }),
    );
    const result = readCachedUpdateInfo('0.0.6');
    expect(result).toEqual({
      updateAvailable: false,
      currentVersion: '0.0.6',
      latestVersion: '0.0.6',
    });
  });

  it('returns null for corrupt JSON', () => {
    vi.spyOn(fs, 'readFileSync').mockReturnValue('not json{{{');
    expect(readCachedUpdateInfo('0.0.6')).toBeNull();
  });

  it('returns null when latestVersion field is missing', () => {
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({ checkedAt: Date.now() }),
    );
    expect(readCachedUpdateInfo('0.0.6')).toBeNull();
  });
});

describe('refreshCacheInBackground', () => {
  let tmpDir: string;
  let tmpCacheFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'iconwolf-test-'));
    tmpCacheFile = path.join(tmpDir, 'update-check.json');
    vi.restoreAllMocks();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('skips fetch when cache is fresh', async () => {
    fs.writeFileSync(
      tmpCacheFile,
      JSON.stringify({ latestVersion: '0.0.6', checkedAt: Date.now() }),
    );

    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await refreshCacheInBackground(tmpCacheFile);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fetches when cache is stale', async () => {
    // Write cache with old mtime
    fs.writeFileSync(
      tmpCacheFile,
      JSON.stringify({ latestVersion: '0.0.6', checkedAt: Date.now() }),
    );
    // Make it old by setting mtime to 25 hours ago
    const staleTime = new Date(Date.now() - 25 * 60 * 60 * 1000);
    fs.utimesSync(tmpCacheFile, staleTime, staleTime);

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ tag_name: 'v0.0.7' }), { status: 200 }),
    );

    await refreshCacheInBackground(tmpCacheFile);

    const cache = JSON.parse(fs.readFileSync(tmpCacheFile, 'utf-8'));
    expect(cache.latestVersion).toBe('0.0.7');
  });

  it('fetches when cache is missing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ tag_name: 'v0.0.7' }), { status: 200 }),
    );

    await refreshCacheInBackground(tmpCacheFile);

    const cache = JSON.parse(fs.readFileSync(tmpCacheFile, 'utf-8'));
    expect(cache.latestVersion).toBe('0.0.7');
  });

  it('strips v prefix from tag_name', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ tag_name: 'v1.2.3' }), { status: 200 }),
    );

    await refreshCacheInBackground(tmpCacheFile);

    const cache = JSON.parse(fs.readFileSync(tmpCacheFile, 'utf-8'));
    expect(cache.latestVersion).toBe('1.2.3');
  });

  it('handles network errors silently', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network fail'));

    await expect(
      refreshCacheInBackground(tmpCacheFile),
    ).resolves.toBeUndefined();
    expect(fs.existsSync(tmpCacheFile)).toBe(false);
  });

  it('handles non-ok responses silently', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Not Found', { status: 404 }),
    );

    await expect(
      refreshCacheInBackground(tmpCacheFile),
    ).resolves.toBeUndefined();
    expect(fs.existsSync(tmpCacheFile)).toBe(false);
  });

  it('handles missing tag_name silently', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    await expect(
      refreshCacheInBackground(tmpCacheFile),
    ).resolves.toBeUndefined();
    expect(fs.existsSync(tmpCacheFile)).toBe(false);
  });
});
