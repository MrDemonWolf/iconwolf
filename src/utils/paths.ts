import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_OUTPUT_DIR = './assets/images';

/**
 * Detect the default output directory based on project structure.
 * If a `src/` directory exists (common in React Native/Expo projects),
 * defaults to `./src/assets/images/`. Otherwise uses `./assets/images/`.
 */
export function resolveDefaultOutputDir(): string {
  const srcDir = path.resolve('src');
  if (fs.existsSync(srcDir) && fs.statSync(srcDir).isDirectory()) {
    return './src/assets/images';
  }
  return DEFAULT_OUTPUT_DIR;
}

export const OUTPUT_FILES = {
  icon: 'icon.png',
  androidForeground: 'android-icon-foreground.png',
  androidBackground: 'android-icon-background.png',
  androidMonochrome: 'android-icon-monochrome.png',
  favicon: 'favicon.png',
  splashIcon: 'splash-icon.png',
} as const;

export function resolveOutputPath(outputDir: string, fileName: string): string {
  return path.resolve(outputDir, fileName);
}
