import sharp from 'sharp';
import { applyRoundedCorners } from '../utils/image.js';
import { resolveOutputPath, OUTPUT_FILES } from '../utils/paths.js';
import type { GenerationResult } from '../types.js';

const FAVICON_SIZE = 48;

export async function generateFavicon(
  inputPath: string,
  outputDir: string,
): Promise<GenerationResult> {
  const outputPath = resolveOutputPath(outputDir, OUTPUT_FILES.favicon);

  const resized = await sharp(inputPath)
    .resize(FAVICON_SIZE, FAVICON_SIZE, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const rounded = await applyRoundedCorners(resized, FAVICON_SIZE);

  const info = await sharp(rounded).png().toFile(outputPath);

  return {
    filePath: outputPath,
    width: info.width,
    height: info.height,
    size: info.size,
  };
}
