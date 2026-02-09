import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { resolveOutputPath, OUTPUT_FILES, DEFAULT_OUTPUT_DIR } from '../../src/utils/paths.js';

describe('paths', () => {
  it('DEFAULT_OUTPUT_DIR is ./assets/images', () => {
    expect(DEFAULT_OUTPUT_DIR).toBe('./assets/images');
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
