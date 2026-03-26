import { useRef } from 'react';

interface SplashUploadProps {
  onFileSelect: (file: File) => void;
  fileName?: string;
}

export function SplashUpload({ onFileSelect, fileName }: SplashUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="border border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".png,.zip"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
        }}
        className="hidden"
      />
      {fileName ? (
        <p className="text-sm text-muted-foreground">
          {fileName} (click to replace)
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Click to select splash image (PNG or .icon ZIP)
        </p>
      )}
    </div>
  );
}
