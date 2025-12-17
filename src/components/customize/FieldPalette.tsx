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
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
      validation: {
        fileValidation: {
          multiple: false,
          maxSize: 10485760, // 10MB default
          maxFiles: 1,
        },
      },
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

interface FieldPaletteProps {
  onAddField?: (fieldType: FormFieldType) => void;
  isChildSelectionMode?: boolean;
  onSelectChildType?: (fieldType: FormFieldType) => void;
}

export default function FieldPalette({
  onAddField,
  isChildSelectionMode = false,
  onSelectChildType,
}: FieldPaletteProps) {
  const handleClick = (fieldType: FormFieldType) => {
    if (isChildSelectionMode && onSelectChildType) {
      onSelectChildType(fieldType);
    } else if (onAddField) {
      onAddField(fieldType);
    }
  };

  return (
    <div
      className={cn(
        'h-full flex flex-col transition-all',
        isChildSelectionMode && 'ring-4 ring-primary ring-offset-2 animate-pulse bg-primary/5'
      )}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <h3 className="font-semibold text-sm">
          {isChildSelectionMode ? 'Select Child Field Type' : 'Field Types'}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {isChildSelectionMode ? 'Click a field type to add as child' : 'Click + to add field'}
        </p>
      </div>

      {/* Field Type List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {FIELD_TYPES.map((fieldType) => {
          const Icon = IconMap[fieldType.icon];
          const isConditionalCapable = CONDITIONAL_CAPABLE_TYPES.includes(fieldType.type);

          return (
            <button
              key={fieldType.type}
              onClick={() => handleClick(fieldType.type)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2.5 rounded-md transition-all group',
                isChildSelectionMode
                  ? 'hover:bg-primary/20 hover:border-primary border-2 border-transparent cursor-pointer'
                  : 'hover:bg-accent cursor-pointer'
              )}
              title={fieldType.description}
            >
              {/* Icon */}
              <div className="flex-shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
                <Icon className="h-4 w-4" />
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0 text-sm font-medium truncate text-left">
                {fieldType.label}
              </div>

              {/* Plus Icon (when NOT in selection mode) */}
              {!isChildSelectionMode && (
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="h-4 w-4 text-primary" />
                </div>
              )}

              {/* Conditional Indicator */}
              {isConditionalCapable && (
                <div className="flex-shrink-0" title="Supports conditional logic">
                  <Zap className="h-3 w-3 text-orange-500" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Export field types for use in other components
export { FIELD_TYPES };
