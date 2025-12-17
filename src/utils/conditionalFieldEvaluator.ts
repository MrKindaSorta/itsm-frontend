import type { FormField, ConditionRule } from '@/types/formBuilder';

/**
 * Evaluates if a field should be visible based on its conditional logic
 * @param visitedFields Set of field IDs already visited (for circular dependency detection)
 */
export function evaluateFieldVisibility(
  field: FormField,
  allFields: FormField[],
  fieldValues: Record<string, any>,
  visitedFields: Set<string> = new Set()
): boolean {
  const nestingLevel = field.conditionalLogic?.nestingLevel || 0;
  const fieldType = nestingLevel === 0 ? 'ROOT' : nestingLevel === 1 ? 'CHILD' : 'GRANDCHILD';

  console.group(`🔍 [${fieldType}] Evaluating visibility for: ${field.label} (${field.id})`);

  // If conditional logic is disabled, field is always visible
  if (!field.conditionalLogic?.enabled) {
    console.log('✅ Conditional logic DISABLED → Always visible');
    console.groupEnd();
    return true;
  }

  // If this is a child field, check if parent conditions are met
  const parentFieldId = field.conditionalLogic.parentFieldId;
  if (!parentFieldId) {
    // Root field with conditional logic enabled is always visible
    console.log('✅ ROOT field with conditional logic → Always visible');
    console.groupEnd();
    return true;
  }

  console.log(`👨‍👦 Parent field ID: ${parentFieldId}`);

  // Circular dependency protection
  if (visitedFields.has(field.id)) {
    console.error(`❌ Circular dependency detected for field ${field.id}`);
    console.groupEnd();
    return false; // Hide field to prevent infinite recursion
  }

  // Find parent field
  const parentField = allFields.find(f => f.id === parentFieldId);
  if (!parentField) {
    console.error(`❌ Parent field not found: ${parentFieldId}`);
    console.groupEnd();
    return false; // Parent not found, hide field
  }

  console.log(`👨 Parent field found: ${parentField.label}`);

  // Add current field to visited set
  const newVisitedFields = new Set(visitedFields);
  newVisitedFields.add(field.id);

  // First check if parent itself is visible
  console.log('🔄 Checking if parent is visible...');
  const isParentVisible = evaluateFieldVisibility(parentField, allFields, fieldValues, newVisitedFields);

  if (!isParentVisible) {
    console.log('❌ Parent is HIDDEN → Child must be hidden too');
    console.groupEnd();
    return false; // Parent is hidden, so child must be hidden too
  }

  console.log('✅ Parent is VISIBLE → Checking conditions...');

  // Get parent's value
  const parentValue = fieldValues[parentFieldId];
  console.log(`📊 Parent value:`, parentValue);

  // Evaluate conditions
  const conditions = field.conditionalLogic.conditions || [];
  if (conditions.length === 0) {
    console.log('❌ No conditions defined → Hide by default');
    console.groupEnd();
    return false; // No conditions defined, hide by default
  }

  console.log(`🧪 Evaluating ${conditions.length} condition(s) (AND logic):`);

  // All conditions must be met (AND logic)
  const allConditionsMet = conditions.every((condition, index) => {
    const result = evaluateCondition(condition, parentValue);
    console.log(`  ${index + 1}. Condition type: ${condition.type}, Result: ${result ? '✅' : '❌'}`);
    return result;
  });

  if (allConditionsMet) {
    console.log('✅ All conditions MET → Field VISIBLE');
  } else {
    console.log('❌ Some conditions FAILED → Field HIDDEN');
  }

  console.groupEnd();
  return allConditionsMet;
}

/**
 * Evaluates a single condition rule
 */
function evaluateCondition(
  condition: ConditionRule,
  value: any
): boolean {
  console.log(`    🔬 Evaluating condition:`, { type: condition.type, value });

  let result: boolean;

  switch (condition.type) {
    case 'equals':
    case 'range':
      result = evaluateNumberCondition(condition, value);
      break;

    case 'optionMatch':
      result = evaluateDropdownCondition(condition, value);
      break;

    case 'checkboxState':
      result = evaluateCheckboxCondition(condition, value);
      break;

    default:
      console.log(`    ❌ Unknown condition type: ${condition.type}`);
      result = false;
  }

  console.log(`    → Result: ${result ? '✅ PASS' : '❌ FAIL'}`);
  return result;
}

/**
 * Evaluates number field conditions (exact value or range)
 */
function evaluateNumberCondition(condition: ConditionRule, value: any): boolean {
  console.log(`      🔢 Number condition - Operator: ${condition.operator}`);

  const numValue = parseFloat(value);
  // If value is empty, null, undefined, or non-numeric, hide the child field
  // This ensures conditional children only appear when a valid number is entered
  if (isNaN(numValue)) {
    console.log(`      ❌ Invalid number value: ${value} (parsed as NaN)`);
    return false;
  }

  console.log(`      📊 Parsed value: ${numValue}`);

  const operator = condition.operator;

  switch (operator) {
    case 'equals':
      console.log(`      🎯 Check: ${numValue} === ${condition.value}`);
      return numValue === condition.value;

    case 'between':
      if (condition.rangeMin !== undefined && condition.rangeMax !== undefined) {
        console.log(`      📏 Check: ${condition.rangeMin} <= ${numValue} <= ${condition.rangeMax}`);
        return numValue >= condition.rangeMin && numValue <= condition.rangeMax;
      }
      console.log(`      ❌ Range not properly defined`);
      return false;

    case 'greaterThan':
      console.log(`      ➕ Check: ${numValue} > ${condition.value}`);
      return condition.value !== undefined && numValue > condition.value;

    case 'lessThan':
      console.log(`      ➖ Check: ${numValue} < ${condition.value}`);
      return condition.value !== undefined && numValue < condition.value;

    default:
      console.log(`      ❌ Unknown operator: ${operator}`);
      return false;
  }
}

/**
 * Evaluates dropdown/category/multiselect field conditions (option matching)
 */
function evaluateDropdownCondition(condition: ConditionRule, value: any): boolean {
  console.log(`      📋 Dropdown condition - Trigger options:`, condition.options);

  if (!condition.options || condition.options.length === 0) {
    console.log(`      ❌ No trigger options defined`);
    return false;
  }

  // Handle multiselect (array of values)
  if (Array.isArray(value)) {
    console.log(`      🔢 Multiselect - Selected values:`, value);
    // Check if any selected value matches any of the trigger options
    const result = value.some(selectedValue => condition.options!.includes(selectedValue));
    console.log(`      ${result ? '✅' : '❌'} Any match found: ${result}`);
    return result;
  }

  // Handle single value (dropdown, category)
  console.log(`      🎯 Single value: ${value}`);
  const result = condition.options.includes(value);
  console.log(`      ${result ? '✅' : '❌'} Value in trigger options: ${result}`);
  return result;
}

/**
 * Evaluates checkbox field conditions (checked/unchecked state)
 */
function evaluateCheckboxCondition(condition: ConditionRule, value: any): boolean {
  console.log(`      ☑️  Checkbox condition - Expected state: ${condition.value ? 'CHECKED' : 'UNCHECKED'}`);
  console.log(`      📊 Raw value:`, value);

  // Coerce to boolean consistently handling various checkbox representations
  // Truthy values: true, 'true', 1, '1', 'on'
  // Falsy values: false, 'false', 0, '0', '', undefined, null
  const boolValue = !!(value && value !== 'false' && value !== '0' && value !== 0);
  console.log(`      🔄 Coerced to boolean: ${boolValue}`);

  const result = boolValue === condition.value;
  console.log(`      ${result ? '✅' : '❌'} Match: ${boolValue} === ${condition.value}`);
  return result;
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
