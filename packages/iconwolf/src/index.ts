#!/usr/bin/env node

import { Command } from 'commander';
import { generate } from './generator.js';
import * as logger from './utils/logger.js';
import { resolveDefaultOutputDir } from './utils/paths.js';
import {
  readCachedUpdateInfo,
  refreshCacheInBackground,
} from './utils/update-notifier.js';
import type { BannerPosition, GeneratorOptions } from './types.js';

const VERSION = '0.1.0';

const program = new Command();

program
  .name('iconwolf')
  .description(
    'Generate all necessary icon variants for cross-platform Expo/React Native projects from a single source icon.',
  )
  .version(VERSION)
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
    '--splash-input <path>',
    'Use a separate image for the splash screen icon',
  )
  .option(
    '--bg-color <hex>',
    'Background color for Android adaptive icon',
    '#FFFFFF',
  )
  .option(
    '--banner <text>',
    'Diagonal ribbon banner text (e.g. DEV, BETA, STAGING)',
  )
  .option('--banner-color <hex>', 'Ribbon color (default: auto from text)')
  .option(
    '--banner-position <pos>',
    'Banner position: top-left, top-right, bottom-left, bottom-right',
    'top-left',
  )
  .action(async (input: string, opts) => {
    const updateInfo = readCachedUpdateInfo(VERSION);
    refreshCacheInBackground().catch(() => {});

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
      splashInputPath: opts.splashInput,
      banner: opts.banner
        ? {
            text: opts.banner,
            color: opts.bannerColor,
            position: opts.bannerPosition as BannerPosition,
          }
        : undefined,
    };

    try {
      await generate(options);

      if (updateInfo?.updateAvailable) {
        logger.updateNotice(
          updateInfo.currentVersion,
          updateInfo.latestVersion,
        );
      }
    } catch (err) {
      logger.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program.parse();
