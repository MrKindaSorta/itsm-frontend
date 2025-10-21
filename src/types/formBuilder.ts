// Form field types supported in the form builder
export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'dropdown'
  | 'multiselect'
  | 'checkbox'
  | 'file'
  | 'cc_users'
  | 'priority'
  | 'category';

// Form field configuration
export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For dropdown and multiselect
  defaultValue?: any;
  helpText?: string;
  order: number;
  isSystemField?: boolean; // System fields are default fields that can't be deleted
  deletable?: boolean; // Whether the field can be deleted from the form
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    maxLength?: number;
  };
}

// Palette field definition (template for creating new fields)
export interface PaletteFieldType {
  type: FormFieldType;
  icon: string;
  label: string;
  description: string;
  defaultConfig: Partial<FormField>;
}

// Complete form configuration
export interface FormConfiguration {
  id: string;
  name: string;
  fields: FormField[];
  createdAt: Date;
  updatedAt: Date;
}

// Field being dragged
export interface DragData {
  fieldId?: string; // Existing field ID (for reordering)
  fieldType?: FormFieldType; // New field type (from palette)
  sourceIndex?: number; // Original position in canvas
}
