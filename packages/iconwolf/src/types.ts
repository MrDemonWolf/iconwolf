export type BannerPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface BannerOptions {
  text: string;
  color?: string;
  position?: BannerPosition;
}

export interface VariantFlags {
  android: boolean;
  favicon: boolean;
  splash: boolean;
  icon: boolean;
}

export interface GeneratorOptions {
  inputPath: string;
  outputDir: string;
  variants: VariantFlags;
  bgColor: string;
  splashInputPath?: string;
  banner?: BannerOptions;
  silent?: boolean;
}

export interface GenerationResult {
  filePath: string;
  width: number;
  height: number;
  size: number;
}
