import fs from 'node:fs';
import path from 'node:path';
import {
  isIconComposerFolder,
  renderIconComposerFolder,
} from './utils/icon-composer.js';
import { validateSourceImage } from './utils/image.js';
import * as logger from './utils/logger.js';
import { DEFAULT_OUTPUT_DIR } from './utils/paths.js';
import { generateStandardIcon } from './variants/standard.js';
import { generateFavicon } from './variants/favicon.js';
import { generateSplashIcon } from './variants/splash.js';
import { generateAndroidIcons } from './variants/android.js';
import type { GeneratorOptions, GenerationResult } from './types.js';

interface ResolvedInput {
  inputPath: string;
  cleanupPath?: string;
  bgColor: string;
}

async function resolveInput(
  resolvedPath: string,
  bgColor: string,
): Promise<ResolvedInput> {
  if (isIconComposerFolder(resolvedPath)) {
    logger.info(`Apple Icon Composer file: ${resolvedPath}`);
    const result = await renderIconComposerFolder(resolvedPath);
    const inputPath = result.composedImagePath;
    const cleanupPath = path.dirname(result.composedImagePath);

    if (bgColor === '#FFFFFF') {
      bgColor = result.extractedBgColor;
      logger.info(`Extracted background color: ${bgColor}`);
    }

    return { inputPath, cleanupPath, bgColor };
  }

  return { inputPath: resolvedPath, bgColor };
}

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
  let splashPath: string | undefined;
  let splashCleanupPath: string | undefined;

  try {
    // Resolve main input (Apple Icon Composer .icon folder or PNG)
    const mainInput = await resolveInput(resolvedInput, bgColor);
    inputPath = mainInput.inputPath;
    cleanupPath = mainInput.cleanupPath;
    bgColor = mainInput.bgColor;

    // Resolve splash input if provided
    if (options.splashInputPath) {
      const resolvedSplashInput = path.resolve(options.splashInputPath);
      if (!fs.existsSync(resolvedSplashInput)) {
        throw new Error(`Splash source not found: ${resolvedSplashInput}`);
      }
      const splashInput = await resolveInput(resolvedSplashInput, bgColor);
      splashPath = splashInput.inputPath;
      splashCleanupPath = splashInput.cleanupPath;
    }

    // Validate source image
    logger.info(`Validating source image: ${inputPath}`);
    const meta = await validateSourceImage(inputPath);
    logger.info(
      `Source: ${meta.width}x${meta.height} ${meta.format.toUpperCase()}`,
    );

    // Validate splash source image if separate
    if (splashPath) {
      logger.info(`Validating splash source image: ${splashPath}`);
      const splashMeta = await validateSourceImage(splashPath);
      logger.info(
        `Splash source: ${splashMeta.width}x${splashMeta.height} ${splashMeta.format.toUpperCase()}`,
      );
    }

    // Create output directory
    fs.mkdirSync(outputDir, { recursive: true });
    logger.info(`Output directory: ${outputDir}`);

    // Determine which variants to generate
    const anyFlagSet =
      variants.android || variants.favicon || variants.splash || variants.icon;
    const generateAll = !anyFlagSet;

    const results: GenerationResult[] = [];

    // Generate selected variants
    if (generateAll || variants.icon) {
      const result = await generateStandardIcon(inputPath, outputDir);
      results.push(result);
      logger.generated(result);
    }

    if (generateAll || variants.android) {
      const androidResults = await generateAndroidIcons(
        inputPath,
        outputDir,
        bgColor,
        { includeBackground: variants.android },
      );
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
      const result = await generateSplashIcon(
        splashPath || inputPath,
        outputDir,
      );
      results.push(result);
      logger.generated(result);
    }

    logger.summary(results);
  } finally {
    // Clean up temp composed images
    if (cleanupPath) {
      fs.rmSync(cleanupPath, { recursive: true, force: true });
    }
    if (splashCleanupPath) {
      fs.rmSync(splashCleanupPath, { recursive: true, force: true });
    }
  }
}
