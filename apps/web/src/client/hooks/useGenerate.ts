import { useState } from 'react';
import {
  generateIcons,
  type GenerateResponse,
  type VariantConfig,
  type BannerConfig,
} from '../lib/api';

interface GenerateState {
  loading: boolean;
  error: string | null;
  data: GenerateResponse | null;
}

export function useGenerate() {
  const [state, setState] = useState<GenerateState>({
    loading: false,
    error: null,
    data: null,
  });

  const generate = async (
    image: File,
    options: {
      variants: VariantConfig;
      bgColor?: string;
      darkBgColor?: string;
      banner?: BannerConfig;
      splashImage?: File;
    },
  ) => {
    setState({ loading: true, error: null, data: null });
    try {
      const data = await generateIcons(image, options);
      setState({ loading: false, error: null, data });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setState({ loading: false, error: message, data: null });
      throw err;
    }
  };

  const reset = () => setState({ loading: false, error: null, data: null });

  return { ...state, generate, reset };
}
