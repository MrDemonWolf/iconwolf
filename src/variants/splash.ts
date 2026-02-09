import { resizeImage } from '../utils/image.js';
import { resolveOutputPath, OUTPUT_FILES } from '../utils/paths.js';
import type { GenerationResult } from '../types.js';

export async function generateSplashIcon(
  inputPath: string,
  outputDir: string,
): Promise<GenerationResult> {
  const outputPath = resolveOutputPath(outputDir, OUTPUT_FILES.splashIcon);
  return resizeImage(inputPath, 1024, 1024, outputPath);
}
