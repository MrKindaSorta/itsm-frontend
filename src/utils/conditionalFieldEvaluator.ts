import type { FormField, ConditionRule } from '@/types/formBuilder';

/**
 * Evaluates if a field should be visible based on its conditional logic
 */
export function evaluateFieldVisibility(
  field: FormField,
  allFields: FormField[],
  fieldValues: Record<string, any>
): boolean {
  // If no conditional logic or not enabled, field is visible if it's a root field
  if (!field.conditionalLogic?.enabled) {
    return !field.conditionalLogic?.parentFieldId;
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
 * Evaluates dropdown field conditions (option matching)
 */
function evaluateDropdownCondition(condition: ConditionRule, value: any): boolean {
  if (!condition.options || condition.options.length === 0) {
    return false;
  }

  // Check if selected value matches any of the trigger options
  return condition.options.includes(value);
}

/**
 * Evaluates checkbox field conditions (checked/unchecked state)
 */
function evaluateCheckboxCondition(condition: ConditionRule, value: any): boolean {
  const boolValue = Boolean(value);
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
