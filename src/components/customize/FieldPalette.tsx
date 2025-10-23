import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PaletteFieldType, FormFieldType } from '@/types/formBuilder';
import {
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
  Zap,
} from 'lucide-react';

// Available field types in the palette
const FIELD_TYPES: PaletteFieldType[] = [
  {
    type: 'text',
    icon: 'Type',
    label: 'Text Input',
    description: 'Single line text field',
    defaultConfig: {
      type: 'text',
      label: 'Text Field',
      placeholder: 'Enter text...',
      required: false,
    },
  },
  {
    type: 'textarea',
    icon: 'AlignLeft',
    label: 'Text Area',
    description: 'Multi-line text field',
    defaultConfig: {
      type: 'textarea',
      label: 'Text Area',
      placeholder: 'Enter detailed text...',
      required: false,
    },
  },
  {
    type: 'number',
    icon: 'Hash',
    label: 'Number',
    description: 'Numeric input field',
    defaultConfig: {
      type: 'number',
      label: 'Number Field',
      placeholder: '0',
      required: false,
    },
  },
  {
    type: 'date',
    icon: 'Calendar',
    label: 'Date Picker',
    description: 'Date selection field',
    defaultConfig: {
      type: 'date',
      label: 'Date Field',
      required: false,
    },
  },
  {
    type: 'dropdown',
    icon: 'ChevronDown',
    label: 'Dropdown',
    description: 'Single selection from list',
    defaultConfig: {
      type: 'dropdown',
      label: 'Dropdown Field',
      placeholder: 'Select an option...',
      required: false,
      options: ['Option 1', 'Option 2', 'Option 3'],
    },
  },
  {
    type: 'multiselect',
    icon: 'List',
    label: 'Multi-Select',
    description: 'Multiple selections from list',
    defaultConfig: {
      type: 'multiselect',
      label: 'Multi-Select Field',
      placeholder: 'Select options...',
      required: false,
      options: ['Option 1', 'Option 2', 'Option 3'],
    },
  },
  {
    type: 'checkbox',
    icon: 'CheckSquare',
    label: 'Checkbox',
    description: 'Single checkbox field',
    defaultConfig: {
      type: 'checkbox',
      label: 'Checkbox Field',
      required: false,
      defaultValue: false,
    },
  },
  {
    type: 'file',
    icon: 'Upload',
    label: 'File Upload',
    description: 'File attachment field',
    defaultConfig: {
      type: 'file',
      label: 'File Upload',
      required: false,
    },
  },
  {
    type: 'cc_users',
    icon: 'Users',
    label: 'CC Users',
    description: 'Allow users to CC others on this ticket',
    defaultConfig: {
      type: 'cc_users',
      label: 'CC Users',
      placeholder: 'Select users to CC...',
      required: false,
    },
  },
  {
    type: 'priority',
    icon: 'Flag',
    label: 'Priority',
    description: 'Ticket priority level (system field)',
    defaultConfig: {
      type: 'priority',
      label: 'Priority',
      placeholder: 'Select priority...',
      required: false,
      options: ['Low', 'Medium', 'High', 'Urgent'],
      defaultValue: 'Medium',
      isSystemField: true,
      deletable: true,
    },
  },
  {
    type: 'category',
    icon: 'FolderOpen',
    label: 'Category',
    description: 'Ticket category (system field)',
    defaultConfig: {
      type: 'category',
      label: 'Category',
      placeholder: 'Select category...',
      required: false,
      options: ['General', 'Hardware', 'Software', 'Network', 'Email', 'Access', 'Onboarding', 'Infrastructure'],
      defaultValue: 'General',
      isSystemField: true,
      deletable: true,
    },
  },
];

// Icon component mapping
const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
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

// Field types that support conditional logic
const CONDITIONAL_CAPABLE_TYPES: FormFieldType[] = ['number', 'dropdown', 'checkbox', 'category', 'multiselect'];

export default function FieldPalette() {
  const handleDragStart = (e: React.DragEvent, fieldType: FormFieldType) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('fieldType', fieldType);
    e.dataTransfer.setData('dragSource', 'palette');
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Field Types</CardTitle>
        <p className="text-sm text-muted-foreground">
          Drag fields to the canvas to build your form
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {FIELD_TYPES.map((fieldType) => {
          const Icon = IconMap[fieldType.icon];
          const isConditionalCapable = CONDITIONAL_CAPABLE_TYPES.includes(fieldType.type);

          return (
            <div
              key={fieldType.type}
              draggable
              onDragStart={(e) => handleDragStart(e, fieldType.type)}
              className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary cursor-move transition-colors group relative"
            >
              <div className="mt-0.5 p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-sm">{fieldType.label}</div>
                  {isConditionalCapable && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 gap-1 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800"
                      title="Supports conditional logic"
                    >
                      <Zap className="h-2.5 w-2.5" />
                      Conditional
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {fieldType.description}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// Export field types for use in other components
export { FIELD_TYPES };
