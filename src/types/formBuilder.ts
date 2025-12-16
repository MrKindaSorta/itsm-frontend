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

// Condition type for different field types
export type ConditionType = 'equals' | 'range' | 'optionMatch' | 'checkboxState';

// Condition operator for number fields
export type ConditionOperator = 'equals' | 'between' | 'greaterThan' | 'lessThan';

// Single condition rule
export interface ConditionRule {
  type: ConditionType;
  operator?: ConditionOperator; // For number fields
  value?: any; // Single value for 'equals', boolean for checkbox
  rangeMin?: number; // For number range
  rangeMax?: number; // For number range
  options?: string[]; // For dropdown multi-option match
}

// Conditional logic configuration
export interface ConditionalLogic {
  enabled: boolean;
  parentFieldId?: string; // Reference to parent field (if this is a child)
  conditions: ConditionRule[]; // Conditions to show this field
  childFields?: string[]; // IDs of fields that depend on this field
  nestingLevel?: number; // Track depth (0 = root, 1 = child, 2 = grandchild)
}

// File validation configuration (for file upload fields)
export interface FileValidation {
  accept?: string; // File type restrictions (e.g., "image/*,.pdf")
  maxSize?: number; // Max file size in bytes (e.g., 10485760 for 10MB)
  maxFiles?: number; // Max number of files (only for multiple mode)
  multiple?: boolean; // Allow multiple file selection (default: false)
}

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
  hidden?: boolean; // Whether the field is hidden from the form (but still exists in config)
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    maxLength?: number;
    fileValidation?: FileValidation; // File-specific validation
  };
  conditionalLogic?: ConditionalLogic; // Conditional field logic
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
