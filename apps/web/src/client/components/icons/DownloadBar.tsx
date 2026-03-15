import type { GenerateResult } from '../../lib/api';
import { getDownloadUrl } from '../../lib/api';

interface DownloadBarProps {
  sessionId: string;
  results: GenerateResult[];
}

function downloadBase64(name: string, base64: string) {
  const link = document.createElement('a');
  link.href = `data:image/png;base64,${base64}`;
  link.download = name;
  link.click();
}

export function DownloadBar({ sessionId, results }: DownloadBarProps) {
  return (
    <div className="sticky bottom-0 bg-card/95 backdrop-blur border-t border-border py-4 -mx-4 px-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <a
          href={getDownloadUrl(sessionId)}
          className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          Download All (ZIP)
        </a>

        <div className="flex flex-wrap gap-2">
          {results.map((result) => (
            <button
              key={result.name}
              onClick={() => downloadBase64(result.name, result.base64)}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
            >
              {result.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
