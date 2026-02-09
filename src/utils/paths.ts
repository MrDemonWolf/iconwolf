import path from 'node:path';

export const DEFAULT_OUTPUT_DIR = './assets/images';

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
