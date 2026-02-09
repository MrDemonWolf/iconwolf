import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import { resolveOutputPath, OUTPUT_FILES, DEFAULT_OUTPUT_DIR, resolveDefaultOutputDir } from '../../src/utils/paths.js';

describe('paths', () => {
  it('DEFAULT_OUTPUT_DIR is ./assets/images', () => {
    expect(DEFAULT_OUTPUT_DIR).toBe('./assets/images');
  });

  it('resolveDefaultOutputDir returns src/assets/images when src/ exists', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);
    expect(resolveDefaultOutputDir()).toBe('./src/assets/images');
    vi.restoreAllMocks();
  });

  it('resolveDefaultOutputDir returns assets/images when no src/', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    expect(resolveDefaultOutputDir()).toBe('./assets/images');
    vi.restoreAllMocks();
  });

  it('OUTPUT_FILES contains all expected file names', () => {
    expect(OUTPUT_FILES.icon).toBe('icon.png');
    expect(OUTPUT_FILES.androidForeground).toBe('android-icon-foreground.png');
    expect(OUTPUT_FILES.androidBackground).toBe('android-icon-background.png');
    expect(OUTPUT_FILES.androidMonochrome).toBe('android-icon-monochrome.png');
    expect(OUTPUT_FILES.favicon).toBe('favicon.png');
    expect(OUTPUT_FILES.splashIcon).toBe('splash-icon.png');
  });

  it('resolveOutputPath returns absolute path', () => {
    const result = resolveOutputPath('/tmp/out', 'icon.png');
    expect(result).toBe(path.resolve('/tmp/out', 'icon.png'));
    expect(path.isAbsolute(result)).toBe(true);
  });

  it('resolveOutputPath resolves relative dirs', () => {
    const result = resolveOutputPath('./assets', 'favicon.png');
    expect(path.isAbsolute(result)).toBe(true);
    expect(result.endsWith('favicon.png')).toBe(true);
  });
});
