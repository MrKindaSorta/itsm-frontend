import type { FormField } from '@/types/formBuilder';

/**
 * Default system fields that appear in every ticket form
 * Title and Description are mandatory (non-deletable)
 * Priority and Category are optional system fields (deletable, enabled by default)
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
      id: 'system-description',
      type: 'textarea',
      label: 'Description',
      placeholder: 'Provide detailed information about your issue...',
      required: true,
      order: 1,
      isSystemField: true,
      deletable: false,
      helpText: 'Describe your issue in detail so we can help you better',
    },
    {
      id: 'system-priority',
      type: 'priority',
      label: 'Priority',
      placeholder: 'Select priority...',
      required: false,
      order: 2,
      isSystemField: true,
      deletable: true,
      hidden: false,
      helpText: 'How urgent is this issue?',
      options: ['Low', 'Medium', 'High', 'Urgent'],
      defaultValue: 'Medium',
    },
    {
      id: 'system-category',
      type: 'category',
      label: 'Category',
      placeholder: 'Select category...',
      required: false,
      order: 3,
      isSystemField: true,
      deletable: true,
      hidden: false,
      helpText: 'What type of issue is this?',
      options: ['General', 'Hardware', 'Software', 'Network', 'Email', 'Access', 'Onboarding', 'Infrastructure'],
      defaultValue: 'General',
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

  // Check if any mandatory system fields are missing (only Title and Description)
  const mandatoryFieldIds = ['system-title', 'system-description'];
  const existingMandatoryFields = fields.filter(f => mandatoryFieldIds.includes(f.id));

  // If we're missing mandatory fields, we should reinitialize
  return existingMandatoryFields.length < mandatoryFieldIds.length;
}

/**
 * Merge existing custom fields with default system fields
 * Preserves custom fields while ensuring MANDATORY system fields are present
 * Optional system fields (Priority, Category) are only preserved if they exist in config
 * IMPORTANT: Preserves the order property from existing fields
 */
export function mergeWithDefaults(existingFields: FormField[]): FormField[] {
  const defaults = getDefaultFormFields();
  const mandatoryFieldIds = ['system-title', 'system-description'];

  // Build map of existing fields
  const existingFieldMap = new Map(existingFields.map(f => [f.id, f]));

  // All system field IDs
  const allSystemFieldIds = new Set([
    'system-title',
    'system-description',
    'system-priority',
    'system-category',
    'system-attachments', // deprecated
  ]);

  // Get custom fields (non-system)
  const customFields = existingFields.filter(f => !allSystemFieldIds.has(f.id));

  // Merge system fields
  const mergedSystemFields = defaults
    .map(defaultField => {
      const existing = existingFieldMap.get(defaultField.id);
      const isMandatory = mandatoryFieldIds.includes(defaultField.id);

      if (existing) {
        // Field exists in config → preserve it
        return {
          ...defaultField,
          ...existing,
          isSystemField: true,
          deletable: isMandatory ? false : true,
        };
      } else if (isMandatory) {
        // Mandatory field missing → add it
        return defaultField;
      } else {
        // Optional field not in config → user deleted it, don't restore
        return null;
      }
    })
    .filter(Boolean) as FormField[];

  // Combine and sort by order
  const allFields = [...mergedSystemFields, ...customFields];
  return allFields.sort((a, b) => (a.order || 0) - (b.order || 0));
}
