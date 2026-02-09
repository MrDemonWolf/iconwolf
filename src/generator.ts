import fs from 'node:fs';
import path from 'node:path';
import { isIconComposerFolder, renderIconComposerFolder } from './utils/icon-composer.js';
import { validateSourceImage } from './utils/image.js';
import * as logger from './utils/logger.js';
import { DEFAULT_OUTPUT_DIR } from './utils/paths.js';
import { generateStandardIcon } from './variants/standard.js';
import { generateFavicon } from './variants/favicon.js';
import { generateSplashIcon } from './variants/splash.js';
import { generateAndroidIcons } from './variants/android.js';
import type { GeneratorOptions, GenerationResult } from './types.js';

export async function generate(options: GeneratorOptions): Promise<void> {
  const resolvedInput = path.resolve(options.inputPath);
  const outputDir = path.resolve(options.outputDir || DEFAULT_OUTPUT_DIR);
  let { bgColor } = options;
  const { variants } = options;

  logger.banner();

  // Check source exists
  if (!fs.existsSync(resolvedInput)) {
    throw new Error(`Source not found: ${resolvedInput}`);
  }

  let inputPath: string;
  let cleanupPath: string | undefined;

  try {
    // Apple Icon Composer .icon folder (primary input format)
    if (isIconComposerFolder(resolvedInput)) {
      logger.info(`Apple Icon Composer file: ${resolvedInput}`);
      const result = await renderIconComposerFolder(resolvedInput);
      inputPath = result.composedImagePath;
      cleanupPath = path.dirname(result.composedImagePath);

      // Use extracted bg color unless the user explicitly provided one
      if (bgColor === '#FFFFFF') {
        bgColor = result.extractedBgColor;
        logger.info(`Extracted background color: ${bgColor}`);
      }
    } else {
      inputPath = resolvedInput;
    }

    // Validate source image
    logger.info(`Validating source image: ${inputPath}`);
    const meta = await validateSourceImage(inputPath);
    logger.info(`Source: ${meta.width}x${meta.height} ${meta.format.toUpperCase()}`);

    // Create output directory
    fs.mkdirSync(outputDir, { recursive: true });
    logger.info(`Output directory: ${outputDir}`);

    // Determine which variants to generate
    const anyFlagSet = variants.android || variants.favicon || variants.splash || variants.icon;
    const generateAll = !anyFlagSet;

    const results: GenerationResult[] = [];

    // Generate selected variants
    if (generateAll || variants.icon) {
      const result = await generateStandardIcon(inputPath, outputDir);
      results.push(result);
      logger.generated(result);
    }

    if (generateAll || variants.android) {
      const androidResults = await generateAndroidIcons(inputPath, outputDir, bgColor);
      for (const result of androidResults) {
        results.push(result);
        logger.generated(result);
      }
    }

    if (generateAll || variants.favicon) {
      const result = await generateFavicon(inputPath, outputDir);
      results.push(result);
      logger.generated(result);
    }

    if (generateAll || variants.splash) {
      const result = await generateSplashIcon(inputPath, outputDir);
      results.push(result);
      logger.generated(result);
    }

    logger.summary(results);
  } finally {
    // Clean up temp composed image
    if (cleanupPath) {
      fs.rmSync(cleanupPath, { recursive: true, force: true });
    }
  }
}
