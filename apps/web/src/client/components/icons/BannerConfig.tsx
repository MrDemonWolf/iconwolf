import type { BannerConfig as BannerConfigType } from '../../lib/api';

interface BannerConfigProps {
  banner: BannerConfigType;
  onChange: (banner: BannerConfigType) => void;
}

const POSITIONS = [
  { value: 'topLeft', label: 'Top Left' },
  { value: 'topRight', label: 'Top Right' },
  { value: 'bottomLeft', label: 'Bottom Left' },
  { value: 'bottomRight', label: 'Bottom Right' },
];

export function BannerConfig({ banner, onChange }: BannerConfigProps) {
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={banner.enabled}
          onChange={(e) => onChange({ ...banner, enabled: e.target.checked })}
          className="rounded border-border"
        />
        <span className="text-sm font-medium">Add diagonal banner</span>
      </label>

      {banner.enabled && (
        <div className="grid gap-4 md:grid-cols-3 pl-6">
          <div>
            <label className="block text-sm font-medium mb-1.5">Text</label>
            <input
              type="text"
              value={banner.text}
              onChange={(e) => onChange({ ...banner, text: e.target.value })}
              placeholder="BETA"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={banner.color}
                onChange={(e) => onChange({ ...banner, color: e.target.value })}
                className="w-10 h-10 rounded border border-border cursor-pointer"
              />
              <input
                type="text"
                value={banner.color}
                onChange={(e) => onChange({ ...banner, color: e.target.value })}
                className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Position</label>
            <select
              value={banner.position}
              onChange={(e) =>
                onChange({ ...banner, position: e.target.value })
              }
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            >
              {POSITIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
