#!/usr/bin/env node

import { Command } from 'commander';
import { generate } from './generator.js';
import * as logger from './utils/logger.js';
import { resolveDefaultOutputDir } from './utils/paths.js';
import type { GeneratorOptions } from './types.js';

const program = new Command();

program
  .name('iconwolf')
  .description(
    'Generate all necessary icon variants for cross-platform Expo/React Native projects from a single source icon.',
  )
  .version('0.0.6')
  .argument(
    '<input>',
    'Path to an Apple Icon Composer .icon folder or a source PNG',
  )
  .option('-o, --output <dir>', 'Output directory', resolveDefaultOutputDir())
  .option('--android', 'Generate Android adaptive icon variants only')
  .option('--favicon', 'Generate web favicon only')
  .option('--splash', 'Generate splash screen icon only')
  .option('--icon', 'Generate standard icon.png only')
  .option(
    '--bg-color <hex>',
    'Background color for Android adaptive icon',
    '#FFFFFF',
  )
  .action(async (input: string, opts) => {
    const options: GeneratorOptions = {
      inputPath: input,
      outputDir: opts.output,
      variants: {
        android: opts.android ?? false,
        favicon: opts.favicon ?? false,
        splash: opts.splash ?? false,
        icon: opts.icon ?? false,
      },
      bgColor: opts.bgColor,
    };

    try {
      await generate(options);
    } catch (err) {
      logger.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program.parse();
