import { useState } from 'react';
import * as Icons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

// Available icons for categories
const availableIcons = [
  'FileText', 'Book', 'Mail', 'Wifi', 'Monitor', 'Package', 'Shield', 'AlertCircle',
  'Settings', 'HelpCircle', 'Lock', 'Globe', 'Database', 'Cloud', 'Server', 'Smartphone',
  'Printer', 'Headphones', 'Wrench', 'Briefcase', 'Users', 'UserCheck', 'Key', 'Zap',
  'Cpu', 'HardDrive', 'Network', 'Terminal', 'Code', 'GitBranch', 'Layers', 'Layout',
];

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [search, setSearch] = useState('');

  const filteredIcons = availableIcons.filter(icon =>
    icon.toLowerCase().includes(search.toLowerCase())
  );

  const SelectedIcon = Icons[value as keyof typeof Icons] as React.ComponentType<{ className?: string }>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
        {SelectedIcon && <SelectedIcon className="h-5 w-5" />}
        <span className="text-sm font-medium">{value || 'No icon selected'}</span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search icons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-6 gap-2 max-h-[300px] overflow-y-auto p-2 border rounded-lg">
        {filteredIcons.map((iconName) => {
          const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
          return (
            <Button
              key={iconName}
              variant={value === iconName ? 'default' : 'outline'}
              size="sm"
              className="h-12 w-12 p-0"
              onClick={() => onChange(iconName)}
              title={iconName}
            >
              <IconComponent className="h-5 w-5" />
            </Button>
          );
        })}
      </div>
    </div>
  );
}
