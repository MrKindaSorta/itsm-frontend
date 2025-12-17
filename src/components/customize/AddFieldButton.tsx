import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { FormFieldType, PaletteFieldType } from '@/types/formBuilder';
import {
  Plus,
  Type,
  AlignLeft,
  Hash,
  Calendar,
  ChevronDown,
  List,
  CheckSquare,
  Upload,
  Users,
  Flag,
  FolderOpen,
} from 'lucide-react';

interface AddFieldButtonProps {
  onAddField: (fieldType: FormFieldType) => void;
  fieldTypes: PaletteFieldType[];
}

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Type,
  AlignLeft,
  Hash,
  Calendar,
  ChevronDown,
  List,
  CheckSquare,
  Upload,
  Users,
  Flag,
  FolderOpen,
};

export default function AddFieldButton({ onAddField, fieldTypes }: AddFieldButtonProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (fieldType: FormFieldType) => {
    onAddField(fieldType);
    setOpen(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full gap-2" size="lg">
            <Plus className="h-4 w-4" />
            Add Field
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-[320px]">
          {fieldTypes.map((fieldType) => {
            const Icon = ICON_MAP[fieldType.icon];
            return (
              <DropdownMenuItem
                key={fieldType.type}
                onClick={() => handleSelect(fieldType.type)}
                className="cursor-pointer py-3"
              >
                <div className="flex items-start gap-3">
                  {Icon && (
                    <div className="flex-shrink-0 text-muted-foreground mt-0.5">
                      <Icon className="h-4 w-4" />
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-sm">{fieldType.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {fieldType.description}
                    </span>
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
