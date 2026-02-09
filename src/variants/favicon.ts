import { resizeImage } from '../utils/image.js';
import { resolveOutputPath, OUTPUT_FILES } from '../utils/paths.js';
import type { GenerationResult } from '../types.js';

export async function generateFavicon(
  inputPath: string,
  outputDir: string,
): Promise<GenerationResult> {
  const outputPath = resolveOutputPath(outputDir, OUTPUT_FILES.favicon);
  return resizeImage(inputPath, 48, 48, outputPath);
}
