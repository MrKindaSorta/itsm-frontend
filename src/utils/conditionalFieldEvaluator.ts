import type { FormField, ConditionRule } from '@/types/formBuilder';

/**
 * Evaluates if a field should be visible based on its conditional logic
 */
export function evaluateFieldVisibility(
  field: FormField,
  allFields: FormField[],
  fieldValues: Record<string, any>
): boolean {
  // If conditional logic is disabled, field is always visible
  if (!field.conditionalLogic?.enabled) {
    return true;
  }

  // If this is a child field, check if parent conditions are met
  const parentFieldId = field.conditionalLogic.parentFieldId;
  if (!parentFieldId) {
    // Root field with conditional logic enabled is always visible
    return true;
  }

  // Find parent field
  const parentField = allFields.find(f => f.id === parentFieldId);
  if (!parentField) {
    return false; // Parent not found, hide field
  }

  // First check if parent itself is visible
  const isParentVisible = evaluateFieldVisibility(parentField, allFields, fieldValues);
  if (!isParentVisible) {
    return false; // Parent is hidden, so child must be hidden too
  }

  // Get parent's value
  const parentValue = fieldValues[parentFieldId];

  // Evaluate conditions
  const conditions = field.conditionalLogic.conditions || [];
  if (conditions.length === 0) {
    return false; // No conditions defined, hide by default
  }

  // All conditions must be met (AND logic)
  return conditions.every(condition => {
    return evaluateCondition(condition, parentValue);
  });
}

/**
 * Evaluates a single condition rule
 */
function evaluateCondition(
  condition: ConditionRule,
  value: any
): boolean {
  switch (condition.type) {
    case 'equals':
    case 'range':
      return evaluateNumberCondition(condition, value);

    case 'optionMatch':
      return evaluateDropdownCondition(condition, value);

    case 'checkboxState':
      return evaluateCheckboxCondition(condition, value);

    default:
      return false;
  }
}

/**
 * Evaluates number field conditions (exact value or range)
 */
function evaluateNumberCondition(condition: ConditionRule, value: any): boolean {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return false; // Invalid number
  }

  const operator = condition.operator;

  switch (operator) {
    case 'equals':
      return numValue === condition.value;

    case 'between':
      if (condition.rangeMin !== undefined && condition.rangeMax !== undefined) {
        return numValue >= condition.rangeMin && numValue <= condition.rangeMax;
      }
      return false;

    case 'greaterThan':
      return condition.value !== undefined && numValue > condition.value;

    case 'lessThan':
      return condition.value !== undefined && numValue < condition.value;

    default:
      return false;
  }
}

/**
 * Evaluates dropdown/category/multiselect field conditions (option matching)
 */
function evaluateDropdownCondition(condition: ConditionRule, value: any): boolean {
  if (!condition.options || condition.options.length === 0) {
    return false;
  }

  // Handle multiselect (array of values)
  if (Array.isArray(value)) {
    // Check if any selected value matches any of the trigger options
    return value.some(selectedValue => condition.options!.includes(selectedValue));
  }

  // Handle single value (dropdown, category)
  return condition.options.includes(value);
}

/**
 * Evaluates checkbox field conditions (checked/unchecked state)
 */
function evaluateCheckboxCondition(condition: ConditionRule, value: any): boolean {
  // Coerce to boolean consistently (true, 'true', 1 = checked)
  const boolValue = value === true || value === 'true' || value === 1;
  return boolValue === condition.value;
}

/**
 * Gets all visible fields based on current field values
 */
export function getVisibleFields(
  allFields: FormField[],
  fieldValues: Record<string, any>
): FormField[] {
  return allFields.filter(field => evaluateFieldVisibility(field, allFields, fieldValues));
}

/**
 * Gets visible fields in hierarchical order where children appear directly below their parents
 */
export function getVisibleFieldsInHierarchicalOrder(
  allFields: FormField[],
  fieldValues: Record<string, any>
): FormField[] {
  // First get all visible fields
  const visibleFields = getVisibleFields(allFields, fieldValues);

  // Create a map for quick lookup
  const fieldMap = new Map<string, FormField>();
  visibleFields.forEach(field => fieldMap.set(field.id, field));

  // Find root fields (no parent or parent not in visible fields)
  const rootFields = visibleFields.filter(field => !field.conditionalLogic?.parentFieldId);

  // Sort root fields by their order property
  rootFields.sort((a, b) => (a.order || 0) - (b.order || 0));

  // Recursively build hierarchical list
  const result: FormField[] = [];

  const addFieldWithChildren = (field: FormField) => {
    // Add the field itself
    result.push(field);

    // Find and add all visible children of this field
    const children = visibleFields.filter(
      f => f.conditionalLogic?.parentFieldId === field.id
    );

    // Sort children by their order property
    children.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Recursively add each child and its descendants
    children.forEach(child => addFieldWithChildren(child));
  };

  // Build the hierarchical list starting from root fields
  rootFields.forEach(rootField => addFieldWithChildren(rootField));

  return result;
}

/**
 * Gets fields that should be hidden when a parent field value changes
 * This is used to clear values of hidden fields
 */
export function getFieldsToHide(
  allFields: FormField[],
  fieldValues: Record<string, any>,
  changedFieldId: string
): string[] {
  const fieldsToHide: string[] = [];

  // Find all fields that depend on the changed field
  const dependentFields = allFields.filter(
    f => f.conditionalLogic?.parentFieldId === changedFieldId
  );

  dependentFields.forEach(field => {
    const isVisible = evaluateFieldVisibility(field, allFields, fieldValues);
    if (!isVisible) {
      fieldsToHide.push(field.id);

      // Recursively check children of this field
      const childrenToHide = getFieldsToHide(allFields, fieldValues, field.id);
      fieldsToHide.push(...childrenToHide);
    }
  });

  return fieldsToHide;
}
