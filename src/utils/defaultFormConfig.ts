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
 * Preserves custom fields while ensuring system fields are present
 * IMPORTANT: Preserves the order property from existing fields
 */
export function mergeWithDefaults(existingFields: FormField[]): FormField[] {
  const defaults = getDefaultFormFields();

  // All possible system field IDs
  const allSystemFieldIds = new Set([
    'system-title',
    'system-description',
    'system-priority',
    'system-category',
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
      // Only Title and Description are truly non-deletable
      const isNonDeletable = ['system-title', 'system-description'].includes(defaultField.id);
      return {
        ...defaultField,
        ...existing,
        isSystemField: true,
        deletable: isNonDeletable ? false : (existing.deletable ?? defaultField.deletable),
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
