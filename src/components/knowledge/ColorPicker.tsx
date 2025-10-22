import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

// Available colors for categories
const availableColors = [
  { name: 'Blue', value: 'text-blue-500', bg: 'bg-blue-500' },
  { name: 'Green', value: 'text-green-500', bg: 'bg-green-500' },
  { name: 'Purple', value: 'text-purple-500', bg: 'bg-purple-500' },
  { name: 'Orange', value: 'text-orange-500', bg: 'bg-orange-500' },
  { name: 'Red', value: 'text-red-500', bg: 'bg-red-500' },
  { name: 'Indigo', value: 'text-indigo-500', bg: 'bg-indigo-500' },
  { name: 'Teal', value: 'text-teal-500', bg: 'bg-teal-500' },
  { name: 'Yellow', value: 'text-yellow-600', bg: 'bg-yellow-600' },
  { name: 'Pink', value: 'text-pink-500', bg: 'bg-pink-500' },
  { name: 'Cyan', value: 'text-cyan-500', bg: 'bg-cyan-500' },
  { name: 'Lime', value: 'text-lime-500', bg: 'bg-lime-500' },
  { name: 'Amber', value: 'text-amber-500', bg: 'bg-amber-500' },
];

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const selectedColor = availableColors.find(c => c.value === value);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
        {selectedColor && (
          <>
            <div className={`h-5 w-5 rounded ${selectedColor.bg}`} />
            <span className="text-sm font-medium">{selectedColor.name}</span>
          </>
        )}
        {!selectedColor && <span className="text-sm text-muted-foreground">No color selected</span>}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {availableColors.map((color) => (
          <Button
            key={color.value}
            variant="outline"
            className="h-auto p-3 flex items-center gap-2 justify-start"
            onClick={() => onChange(color.value)}
          >
            <div className={`h-5 w-5 rounded ${color.bg} flex-shrink-0`} />
            <span className="text-xs">{color.name}</span>
            {value === color.value && <Check className="h-4 w-4 ml-auto text-primary" />}
          </Button>
        ))}
      </div>
    </div>
  );
}
