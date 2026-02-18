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
}

export interface GenerationResult {
  filePath: string;
  width: number;
  height: number;
  size: number;
}
