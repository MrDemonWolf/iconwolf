interface ColorPickerProps {
  bgColor: string;
  darkBgColor: string;
  onBgColorChange: (color: string) => void;
  onDarkBgColorChange: (color: string) => void;
}

export function ColorPicker({
  bgColor,
  darkBgColor,
  onBgColorChange,
  onDarkBgColorChange,
}: ColorPickerProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5">Background Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={bgColor || '#ffffff'}
            onChange={(e) => onBgColorChange(e.target.value)}
            className="w-10 h-10 rounded border border-border cursor-pointer"
          />
          <input
            type="text"
            value={bgColor}
            onChange={(e) => onBgColorChange(e.target.value)}
            placeholder="#FFFFFF"
            className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Dark Background Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={darkBgColor || '#000000'}
            onChange={(e) => onDarkBgColorChange(e.target.value)}
            className="w-10 h-10 rounded border border-border cursor-pointer"
          />
          <input
            type="text"
            value={darkBgColor}
            onChange={(e) => onDarkBgColorChange(e.target.value)}
            placeholder="#000000 (optional)"
            className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm"
          />
        </div>
      </div>
    </div>
  );
}
