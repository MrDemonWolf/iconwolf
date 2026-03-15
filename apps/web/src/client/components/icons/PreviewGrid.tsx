import { useState } from 'react';
import type { GenerateResult } from '../../lib/api';

interface PreviewGridProps {
  results: GenerateResult[];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function PreviewGrid({ results }: PreviewGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {results.map((result, i) => (
          <div
            key={result.name}
            onClick={() => setSelectedIndex(i)}
            className="border border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors"
          >
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-3 overflow-hidden">
              <img
                src={`data:image/png;base64,${result.base64}`}
                alt={result.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <p className="text-sm font-medium truncate">{result.name}</p>
            <div className="flex gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {result.width}x{result.height}
              </span>
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {formatSize(result.size)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Full-size dialog */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelectedIndex(null)}
        >
          <div
            className="bg-card rounded-2xl p-6 max-w-lg w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{results[selectedIndex].name}</h3>
              <button
                onClick={() => setSelectedIndex(null)}
                className="p-1 hover:bg-accent rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="bg-muted rounded-xl p-4 flex items-center justify-center">
              <img
                src={`data:image/png;base64,${results[selectedIndex].base64}`}
                alt={results[selectedIndex].name}
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>
            <div className="mt-3 flex gap-3 text-sm text-muted-foreground">
              <span>{results[selectedIndex].width}x{results[selectedIndex].height}</span>
              <span>{formatSize(results[selectedIndex].size)}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
