import { useCallback, useRef, useState } from 'react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  preview: string | null;
  fileName?: string;
}

export function UploadZone({
  onFileSelect,
  preview,
  fileName,
}: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
        ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".png,.zip"
        onChange={handleChange}
        className="hidden"
      />

      {preview ? (
        <div className="flex flex-col items-center gap-3">
          <img
            src={preview}
            alt="Uploaded icon"
            className="w-32 h-32 object-contain rounded-lg"
          />
          <p className="text-sm text-muted-foreground">{fileName}</p>
          <p className="text-xs text-muted-foreground">
            Click or drag to replace
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" x2="12" y1="3" y2="15" />
          </svg>
          <div>
            <p className="font-medium">
              Drop your icon here or click to browse
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              PNG file or .icon folder (as ZIP)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
