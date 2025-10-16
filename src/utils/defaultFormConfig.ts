import type { FormField } from '@/types/formBuilder';

/**
 * Default system fields that appear in every ticket form
 * These fields are non-deletable but can be customized
 * Only Title and Description are mandatory system fields
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

  // Check if any system fields are missing (only Title and Description)
  const systemFieldIds = ['system-title', 'system-description'];
  const existingSystemFields = fields.filter(f => systemFieldIds.includes(f.id));

  // If we're missing system fields, we should reinitialize
  return existingSystemFields.length < systemFieldIds.length;
}

/**
 * Merge existing custom fields with default system fields
 * Preserves custom fields while ensuring system fields are present
 * IMPORTANT: Preserves the order property from existing fields
 */
export function mergeWithDefaults(existingFields: FormField[]): FormField[] {
  const defaults = getDefaultFormFields();

  // All possible system field IDs (including deprecated ones)
  const allSystemFieldIds = new Set([
    'system-title',
    'system-description',
    'system-category',      // deprecated
    'system-priority',      // deprecated
    'system-attachments',   // deprecated
  ]);

  // Build a map of existing field IDs to their order values
  const existingFieldMap = new Map(
    existingFields.map(f => [f.id, f])
  );

  // Get existing fields that aren't any system fields (including deprecated ones)
  // This removes old system fields if they exist
  const customFields = existingFields.filter(f => !allSystemFieldIds.has(f.id));

  // Process default system fields - preserve order if they exist, otherwise assign new order
  const mergedSystemFields = defaults.map(defaultField => {
    const existing = existingFieldMap.get(defaultField.id);
    if (existing) {
      // Preserve existing field's order and merge with default config
      return {
        ...defaultField,
        ...existing,
        isSystemField: true,
        deletable: false,
      };
    }
    // New system field - will be assigned order later
    return defaultField;
  });

  // Combine system fields + custom fields
  const allFields = [...mergedSystemFields, ...customFields];

  // Sort by existing order values, putting fields without order at the end
  const fieldsWithOrder = allFields.filter(f => typeof f.order === 'number');
  const fieldsWithoutOrder = allFields.filter(f => typeof f.order !== 'number');

  // Sort fields that have order
  fieldsWithOrder.sort((a, b) => (a.order || 0) - (b.order || 0));

  // Assign order to fields without order
  const maxOrder = fieldsWithOrder.length > 0
    ? Math.max(...fieldsWithOrder.map(f => f.order || 0))
    : -1;

  const assignedFields = fieldsWithoutOrder.map((field, index) => ({
    ...field,
    order: maxOrder + index + 1,
  }));

  // Return sorted by order
  return [...fieldsWithOrder, ...assignedFields].sort((a, b) => (a.order || 0) - (b.order || 0));
}
