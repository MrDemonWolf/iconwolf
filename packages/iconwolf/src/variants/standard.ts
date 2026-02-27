import { resizeImage } from '../utils/image.js';
import { resolveOutputPath, OUTPUT_FILES } from '../utils/paths.js';
import type { GenerationResult } from '../types.js';

export async function generateStandardIcon(
  inputPath: string,
  outputDir: string,
): Promise<GenerationResult> {
  const outputPath = resolveOutputPath(outputDir, OUTPUT_FILES.icon);
  return resizeImage(inputPath, 1024, 1024, outputPath);
}
