import { z } from 'zod';

const bannerSchema = z
  .object({
    text: z
      .string()
      .describe(
        'Text to display on the diagonal ribbon banner (e.g. DEV, BETA, STAGING)',
      ),
    color: z
      .string()
      .optional()
      .describe(
        'Ribbon color as a hex value (e.g. #FF0000) — auto-generated from the text if not set',
      ),
    position: z
      .enum(['top-left', 'top-right', 'bottom-left', 'bottom-right'])
      .optional()
      .describe(
        'Corner to place the ribbon banner (top-left, top-right, bottom-left, bottom-right; default: top-left)',
      ),
  })
  .optional()
  .describe(
    'Optional diagonal ribbon banner to overlay on the icon (e.g. for DEV or BETA builds)',
  );

export const generateIconsSchema = z.object({
  file_path: z
    .string()
    .optional()
    .describe(
      'Absolute path to the source image — a PNG file or an Apple Icon Composer .icon folder',
    ),
  base64_image: z
    .string()
    .optional()
    .describe(
      "The source image as a base64-encoded PNG string (use this when you don't have a file path)",
    ),
  output_dir: z
    .string()
    .optional()
    .describe('Directory where the generated icon files will be saved'),
  bg_color: z
    .string()
    .default('#FFFFFF')
    .describe(
      'Background fill color for the Android adaptive icon (hex, e.g. #FFFFFF)',
    ),
  dark_bg_color: z
    .string()
    .optional()
    .describe(
      'Background fill color for dark mode (hex) — applies to .icon folder output and Android dark variants (iOS 18+ dark/tinted icons)',
    ),
  splash_input_path: z
    .string()
    .optional()
    .describe(
      'Path to a different source image to use for the splash screen (PNG or .icon folder) — uses the main image if not set',
    ),
  variants: z
    .object({
      icon: z.boolean().default(false),
      android: z.boolean().default(false),
      favicon: z.boolean().default(false),
      splash: z.boolean().default(false),
    })
    .optional()
    .describe(
      'Which icon types to generate. Leave empty to generate all four defaults (icon, favicon, splash, Android).',
    ),
  banner: bannerSchema,
});

export const generateSingleSchema = z.object({
  file_path: z
    .string()
    .optional()
    .describe(
      'Absolute path to the source image — a PNG file or an Apple Icon Composer .icon folder',
    ),
  base64_image: z
    .string()
    .optional()
    .describe(
      "The source image as a base64-encoded PNG string (use this when you don't have a file path)",
    ),
  output_dir: z
    .string()
    .optional()
    .describe('Directory where the generated icon files will be saved'),
  banner: bannerSchema,
});

export const generateAndroidSchema = z.object({
  file_path: z
    .string()
    .optional()
    .describe(
      'Absolute path to the source image — a PNG file or an Apple Icon Composer .icon folder',
    ),
  base64_image: z
    .string()
    .optional()
    .describe(
      "The source image as a base64-encoded PNG string (use this when you don't have a file path)",
    ),
  output_dir: z
    .string()
    .optional()
    .describe('Directory where the generated icon files will be saved'),
  bg_color: z
    .string()
    .default('#FFFFFF')
    .describe(
      'Background fill color for the Android adaptive icon (hex, e.g. #FFFFFF)',
    ),
  include_background: z
    .boolean()
    .default(true)
    .describe(
      'Also generate the background color layer and monochrome (silhouette) variant alongside the foreground',
    ),
  banner: bannerSchema,
});

export const generateIconComposerSchema = z.object({
  file_path: z
    .string()
    .optional()
    .describe(
      'Absolute path to the source image — a PNG file or an Apple Icon Composer .icon folder',
    ),
  base64_image: z
    .string()
    .optional()
    .describe(
      "The source image as a base64-encoded PNG string (use this when you don't have a file path)",
    ),
  output_dir: z
    .string()
    .describe(
      'Output path for the .icon folder — must end with .icon (e.g. /path/to/AppIcon.icon)',
    ),
  bg_color: z
    .string()
    .default('#FFFFFF')
    .describe('Light mode background fill color (hex, e.g. #FFFFFF)'),
  dark_bg_color: z
    .string()
    .optional()
    .describe(
      'Dark mode background fill color (hex). When provided, the .icon folder will include separate light and dark icon variants (iOS 18+).',
    ),
  banner: bannerSchema,
});

export type GenerateIconsInput = z.infer<typeof generateIconsSchema>;
export type GenerateSingleInput = z.infer<typeof generateSingleSchema>;
export type GenerateAndroidInput = z.infer<typeof generateAndroidSchema>;
export type GenerateIconComposerInput = z.infer<
  typeof generateIconComposerSchema
>;
