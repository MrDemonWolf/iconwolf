const API_BASE = '/api';

export interface GenerateResult {
  name: string;
  width: number;
  height: number;
  size: number;
  base64: string;
}

export interface GenerateResponse {
  sessionId: string;
  results: GenerateResult[];
}

export interface PreviewResponse {
  name: string;
  width: number;
  height: number;
  size: number;
  base64: string;
}

export interface VariantConfig {
  icon: boolean;
  android: boolean;
  favicon: boolean;
  splash: boolean;
}

export interface BannerConfig {
  enabled: boolean;
  text: string;
  color: string;
  position: string;
}

export async function generateIcons(
  image: File,
  options: {
    variants: VariantConfig;
    bgColor?: string;
    darkBgColor?: string;
    banner?: BannerConfig;
    splashImage?: File;
  },
): Promise<GenerateResponse> {
  const formData = new FormData();
  formData.append('image', image);

  const hasActiveVariant = Object.values(options.variants).some(Boolean);
  if (hasActiveVariant) {
    formData.append('variants', JSON.stringify(options.variants));
  }

  if (options.bgColor) formData.append('bgColor', options.bgColor);
  if (options.darkBgColor) formData.append('darkBgColor', options.darkBgColor);

  if (options.banner?.enabled) {
    formData.append(
      'banner',
      JSON.stringify({
        text: options.banner.text,
        color: options.banner.color,
        position: options.banner.position,
      }),
    );
  }

  if (options.splashImage) {
    formData.append('splashImage', options.splashImage);
  }

  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Generation failed');
  }

  return res.json();
}

export async function previewIcon(
  image: File,
  bgColor?: string,
): Promise<PreviewResponse> {
  const formData = new FormData();
  formData.append('image', image);
  if (bgColor) formData.append('bgColor', bgColor);

  const res = await fetch(`${API_BASE}/preview`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Preview failed');
  }

  return res.json();
}

export function getDownloadUrl(sessionId: string): string {
  return `${API_BASE}/download/${sessionId}`;
}
