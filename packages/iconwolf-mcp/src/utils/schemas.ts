import { z } from 'zod';

const bannerSchema = z
  .object({
    text: z.string().describe('Banner text (e.g. DEV, BETA, STAGING)'),
    color: z
      .string()
      .optional()
      .describe('Ribbon color hex (default: auto from text)'),
    position: z
      .enum(['top-left', 'top-right', 'bottom-left', 'bottom-right'])
      .optional()
      .describe('Banner corner position (default: top-left)'),
  })
  .optional()
  .describe('Diagonal ribbon banner overlay');

export const generateIconsSchema = z.object({
  file_path: z
    .string()
    .optional()
    .describe('Absolute path to a local PNG file or .icon folder'),
  base64_image: z.string().optional().describe('Base64-encoded PNG image data'),
  output_dir: z.string().optional().describe('Output directory path'),
  bg_color: z
    .string()
    .default('#FFFFFF')
    .describe('Background color for Android adaptive icon (hex)'),
  splash_input_path: z
    .string()
    .optional()
    .describe('Separate image path for splash screen (PNG or .icon folder)'),
  variants: z
    .object({
      icon: z.boolean().default(false),
      android: z.boolean().default(false),
      favicon: z.boolean().default(false),
      splash: z.boolean().default(false),
    })
    .optional()
    .describe(
      'Which variants to generate. If omitted, generates all default variants.',
    ),
  banner: bannerSchema,
});

export const generateSingleSchema = z.object({
  file_path: z
    .string()
    .optional()
    .describe('Absolute path to a local PNG file or .icon folder'),
  base64_image: z.string().optional().describe('Base64-encoded PNG image data'),
  output_dir: z.string().optional().describe('Output directory path'),
  banner: bannerSchema,
});

export const generateAndroidSchema = z.object({
  file_path: z
    .string()
    .optional()
    .describe('Absolute path to a local PNG file or .icon folder'),
  base64_image: z.string().optional().describe('Base64-encoded PNG image data'),
  output_dir: z.string().optional().describe('Output directory path'),
  bg_color: z
    .string()
    .default('#FFFFFF')
    .describe('Background color for adaptive icon (hex)'),
  include_background: z
    .boolean()
    .default(true)
    .describe('Include background and monochrome variants'),
  banner: bannerSchema,
});

export const generateIconComposerSchema = z.object({
  file_path: z
    .string()
    .optional()
    .describe('Absolute path to a local PNG file'),
  base64_image: z.string().optional().describe('Base64-encoded PNG image data'),
  output_dir: z
    .string()
    .describe('Output path ending in .icon (e.g. AppIcon.icon)'),
  bg_color: z.string().default('#FFFFFF').describe('Background color (hex)'),
  dark_bg_color: z
    .string()
    .optional()
    .describe(
      'Dark mode background color (hex). When provided, generates fill-specializations with light + dark entries.',
    ),
  banner: bannerSchema,
});

export type GenerateIconsInput = z.infer<typeof generateIconsSchema>;
export type GenerateSingleInput = z.infer<typeof generateSingleSchema>;
export type GenerateAndroidInput = z.infer<typeof generateAndroidSchema>;
export type GenerateIconComposerInput = z.infer<
  typeof generateIconComposerSchema
>;
