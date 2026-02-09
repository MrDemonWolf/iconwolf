import {
  createAdaptiveForeground,
  createSolidBackground,
  createMonochromeIcon,
} from '../utils/image.js';
import { resolveOutputPath, OUTPUT_FILES } from '../utils/paths.js';
import type { GenerationResult } from '../types.js';

const ANDROID_ICON_SIZE = 1024;

export async function generateAndroidIcons(
  inputPath: string,
  outputDir: string,
  bgColor: string,
): Promise<GenerationResult[]> {
  const [foreground, background, monochrome] = await Promise.all([
    createAdaptiveForeground(
      inputPath,
      ANDROID_ICON_SIZE,
      resolveOutputPath(outputDir, OUTPUT_FILES.androidForeground),
    ),
    createSolidBackground(
      bgColor,
      ANDROID_ICON_SIZE,
      resolveOutputPath(outputDir, OUTPUT_FILES.androidBackground),
    ),
    createMonochromeIcon(
      inputPath,
      ANDROID_ICON_SIZE,
      resolveOutputPath(outputDir, OUTPUT_FILES.androidMonochrome),
    ),
  ]);

  return [foreground, background, monochrome];
}
