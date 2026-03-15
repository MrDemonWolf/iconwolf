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

const VERSION = '0.4.0';

const program = new Command();

program
  .name('iconwolf')
  .description(
    'Turn a single image into every icon your app needs — app icon, splash screen, Android adaptive icon, and web favicon.',
  )
  .version(VERSION)
  .argument(
    '<input>',
    'Your source image — a PNG file or an Apple Icon Composer .icon folder',
  )
  .option(
    '-o, --output <dir>',
    'Where to save the generated icons (defaults to src/assets/images/ or assets/images/)',
    resolveDefaultOutputDir(),
  )
  .option(
    '--android',
    'Generate only Android adaptive icons (foreground, background, and monochrome layers)',
  )
  .option('--favicon', 'Generate only the web favicon (48×48 PNG with rounded corners)')
  .option('--splash', 'Generate only the splash screen icon (1024×1024 PNG)')
  .option('--icon', 'Generate only the app icon (1024×1024 PNG)')
  .option(
    '--splash-input <path>',
    'Use a different image for the splash screen (PNG or .icon folder)',
  )
  .option(
    '--bg-color <hex>',
    'Background fill color for the Android adaptive icon (hex, e.g. #FFFFFF)',
    '#FFFFFF',
  )
  .option(
    '--dark-bg-color <hex>',
    'Background fill color for dark mode (hex) — used for .icon folder output and Android dark variants',
  )
  .option(
    '--banner <text>',
    'Add a diagonal ribbon banner to your icon (e.g. DEV, BETA, STAGING)',
  )
  .option(
    '--banner-color <hex>',
    'Banner ribbon color (hex, e.g. #FF0000) — auto-generated from the banner text if not set',
  )
  .option(
    '--banner-position <pos>',
    'Corner to place the banner (top-left, top-right, bottom-left, bottom-right)',
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
      darkBgColor: opts.darkBgColor,
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
