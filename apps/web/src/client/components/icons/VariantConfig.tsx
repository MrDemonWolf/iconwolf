import type { VariantConfig as VariantConfigType } from '../../lib/api';

interface VariantConfigProps {
  variants: VariantConfigType;
  onChange: (variants: VariantConfigType) => void;
}

const VARIANT_INFO = [
  { key: 'icon' as const, label: 'Icon', desc: '1024x1024 icon.png' },
  { key: 'android' as const, label: 'Android', desc: 'Adaptive icon variants' },
  { key: 'favicon' as const, label: 'Favicon', desc: '48x48 favicon.png' },
  {
    key: 'splash' as const,
    label: 'Splash',
    desc: '1024x1024 splash-icon.png',
  },
];

export function VariantConfig({ variants, onChange }: VariantConfigProps) {
  return (
    <div className="space-y-3">
      {VARIANT_INFO.map(({ key, label, desc }) => (
        <label key={key} className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={variants[key]}
            onChange={(e) => onChange({ ...variants, [key]: e.target.checked })}
            className="mt-0.5 rounded border-border"
          />
          <div>
            <span className="font-medium text-sm">{label}</span>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </label>
      ))}
      <p className="text-xs text-muted-foreground italic">
        Leave all unchecked to generate all 4 default outputs
      </p>
    </div>
  );
}
