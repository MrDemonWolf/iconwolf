import { useState } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { UploadZone } from './components/icons/UploadZone';
import { SplashUpload } from './components/icons/SplashUpload';
import { VariantConfig } from './components/icons/VariantConfig';
import { ColorPicker } from './components/icons/ColorPicker';
import { BannerConfig } from './components/icons/BannerConfig';
import { PreviewGrid } from './components/icons/PreviewGrid';
import { DownloadBar } from './components/icons/DownloadBar';
import { useGenerate } from './hooks/useGenerate';
import type { VariantConfig as VariantConfigType, BannerConfig as BannerConfigType } from './lib/api';

export function App() {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [splashImage, setSplashImage] = useState<File | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [variants, setVariants] = useState<VariantConfigType>({
    icon: false,
    android: false,
    favicon: false,
    splash: false,
  });
  const [bgColor, setBgColor] = useState('');
  const [darkBgColor, setDarkBgColor] = useState('');
  const [banner, setBanner] = useState<BannerConfigType>({
    enabled: false,
    text: '',
    color: '#FF0000',
    position: 'topRight',
  });

  const { loading, error, data, generate, reset } = useGenerate();

  const handleImageSelect = (file: File) => {
    setImage(file);
    reset();

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleGenerate = async () => {
    if (!image) return;
    await generate(image, {
      variants,
      bgColor: bgColor || undefined,
      darkBgColor: darkBgColor || undefined,
      banner,
      splashImage: splashImage || undefined,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Upload Section */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Upload Source Image</h2>
            <UploadZone
              onFileSelect={handleImageSelect}
              preview={imagePreview}
              fileName={image?.name}
            />

            <div className="mt-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSplash}
                  onChange={(e) => {
                    setShowSplash(e.target.checked);
                    if (!e.target.checked) setSplashImage(null);
                  }}
                  className="rounded border-border"
                />
                Use separate image for splash screen
              </label>
              {showSplash && (
                <div className="mt-3">
                  <SplashUpload onFileSelect={setSplashImage} fileName={splashImage?.name} />
                </div>
              )}
            </div>
          </section>

          {/* Config Section */}
          <section className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold mb-4">Variants</h2>
              <VariantConfig variants={variants} onChange={setVariants} />
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Colors</h2>
              <ColorPicker
                bgColor={bgColor}
                darkBgColor={darkBgColor}
                onBgColorChange={setBgColor}
                onDarkBgColorChange={setDarkBgColor}
              />
            </div>
          </section>

          {/* Banner Config */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Banner</h2>
            <BannerConfig banner={banner} onChange={setBanner} />
          </section>

          {/* Generate Button */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={!image || loading}
              className="px-8 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity text-lg"
            >
              {loading ? 'Generating...' : 'Generate Icons'}
            </button>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {!Object.values(variants).some(Boolean) && image && (
              <p className="text-sm text-muted-foreground">
                No variants selected — all 4 default icons will be generated
              </p>
            )}
          </div>

          {/* Results */}
          {data && (
            <>
              <section>
                <h2 className="text-lg font-semibold mb-4">Generated Icons</h2>
                <PreviewGrid results={data.results} />
              </section>

              <DownloadBar sessionId={data.sessionId} results={data.results} />
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
