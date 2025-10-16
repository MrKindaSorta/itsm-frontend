import type { FormField } from '@/types/formBuilder';

/**
 * Default system fields that appear in every ticket form
 * These fields are non-deletable but can be customized
 */
export function getDefaultFormFields(): FormField[] {
  return [
    {
      id: 'system-title',
      type: 'text',
      label: 'Title',
      placeholder: 'Brief description of your issue',
      required: true,
      order: 0,
      isSystemField: true,
      deletable: false,
      helpText: 'Provide a short, descriptive title for your ticket',
      validation: {
        maxLength: 200,
      },
    },
    {
      id: 'system-category',
      type: 'dropdown',
      label: 'Category',
      placeholder: 'Select category',
      required: true,
      order: 1,
      isSystemField: true,
      deletable: false,
      helpText: 'Choose the category that best describes your issue',
      options: [
        'Hardware',
        'Software',
        'Network',
        'Email',
        'Access & Permissions',
        'Infrastructure',
        'Onboarding',
        'Other',
      ],
    },
    {
      id: 'system-priority',
      type: 'dropdown',
      label: 'Priority',
      placeholder: 'Select priority',
      required: false,
      order: 2,
      isSystemField: true,
      deletable: false,
      helpText: 'How urgent is this issue?',
      defaultValue: 'medium',
      options: ['low', 'medium', 'high', 'urgent'],
    },
    {
      id: 'system-description',
      type: 'textarea',
      label: 'Description',
      placeholder: 'Provide detailed information about your issue...',
      required: true,
      order: 3,
      isSystemField: true,
      deletable: false,
      helpText: 'Describe your issue in detail so we can help you better',
    },
    {
      id: 'system-attachments',
      type: 'file',
      label: 'Attachments',
      placeholder: '',
      required: false,
      order: 4,
      isSystemField: true,
      deletable: false,
      helpText: 'Upload any relevant files (Max 10MB per file)',
    },
  ];
}

/**
 * Check if the form configuration is empty or missing system fields
 * Returns true if we should initialize with default fields
 */
export function shouldInitializeDefaults(fields: FormField[]): boolean {
  if (!fields || fields.length === 0) {
    return true;
  }

  // Check if any system fields are missing
  const systemFieldIds = ['system-title', 'system-category', 'system-priority', 'system-description', 'system-attachments'];
  const existingSystemFields = fields.filter(f => systemFieldIds.includes(f.id));

  // If we're missing system fields, we should reinitialize
  return existingSystemFields.length < systemFieldIds.length;
}

/**
 * Merge existing custom fields with default system fields
 * Preserves custom fields while ensuring system fields are present
 */
export function mergeWithDefaults(existingFields: FormField[]): FormField[] {
  const defaults = getDefaultFormFields();
  const systemFieldIds = new Set(defaults.map(f => f.id));

  // Get existing fields that aren't system fields
  const customFields = existingFields.filter(f => !systemFieldIds.has(f.id));

  // Combine system fields + custom fields, re-order
  const allFields = [...defaults, ...customFields];

  // Re-number the order
  return allFields.map((field, index) => ({
    ...field,
    order: index,
  }));
}
