import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { FormField, ConditionRule, ConditionalLogic } from '@/types/formBuilder';
import { Zap, ChevronRight } from 'lucide-react';

interface ConditionalLogicEditorProps {
  field: FormField;
  allFields: FormField[];
  onUpdate: (conditionalLogic: ConditionalLogic) => void;
}

export default function ConditionalLogicEditor({
  field,
  allFields,
  onUpdate,
}: ConditionalLogicEditorProps) {
  const conditionalLogic = field.conditionalLogic || {
    enabled: false,
    conditions: [],
    childFields: [],
    nestingLevel: 0,
  };

  const [isEnabled, setIsEnabled] = useState(conditionalLogic.enabled);

  // Check if this field supports conditional logic
  const supportsConditionalLogic = ['number', 'dropdown', 'checkbox', 'category', 'multiselect'].includes(field.type);

  // Calculate current nesting level
  const currentLevel = conditionalLogic.nestingLevel || 0;
  const canAddChildren = currentLevel < 2; // Max 3 levels (0, 1, 2)

  // Get child fields
  const childFields = allFields.filter(f =>
    conditionalLogic.childFields?.includes(f.id)
  );

  const toggleEnabled = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    onUpdate({
      ...conditionalLogic,
      enabled: newEnabled,
    });
  };

  if (!supportsConditionalLogic) {
    return (
      <div className="p-4 border border-border rounded-lg bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          Conditional logic is only available for Number, Dropdown, Checkbox, Category, and Multiselect fields
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-orange-500" />
          <div>
            <Label htmlFor="conditional-enabled" className="font-medium">
              Conditional Logic
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Show child fields based on user input
            </p>
          </div>
        </div>
        <button
          id="conditional-enabled"
          onClick={toggleEnabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isEnabled ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {isEnabled && (
        <>
          {/* Nesting Level Indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              Level {currentLevel}
            </Badge>
            {currentLevel === 0 && <span>Root field</span>}
            {currentLevel === 1 && <span>Child field</span>}
            {currentLevel === 2 && <span>Grandchild field (max depth)</span>}
          </div>

          {/* Condition Configuration based on field type */}
          {field.type === 'number' && (
            <NumberConditionEditor
              conditionalLogic={conditionalLogic}
              onUpdate={onUpdate}
            />
          )}

          {(field.type === 'dropdown' || field.type === 'category' || field.type === 'multiselect') && (
            <DropdownConditionEditor
              field={field}
              conditionalLogic={conditionalLogic}
              allFields={allFields}
              onUpdate={onUpdate}
            />
          )}

          {field.type === 'checkbox' && (
            <CheckboxConditionEditor
              conditionalLogic={conditionalLogic}
              onUpdate={onUpdate}
            />
          )}

          {/* Child Fields List */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Child Fields</Label>
              {!canAddChildren && (
                <Badge variant="outline" className="text-xs text-orange-600">
                  Max depth reached
                </Badge>
              )}
            </div>

            {childFields.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-md">
                <p className="mb-1">No child fields added yet</p>
                <p className="text-[10px]">
                  Hover over this field in the list and click "Add Child" button
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {childFields.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center gap-2 p-2 rounded border bg-muted/30"
                  >
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{child.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {child.type}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Level {(child.conditionalLogic?.nestingLevel || 0) + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Number Field Condition Editor
function NumberConditionEditor({
  conditionalLogic,
  onUpdate,
}: {
  conditionalLogic: ConditionalLogic;
  onUpdate: (logic: ConditionalLogic) => void;
}) {
  const condition = conditionalLogic.conditions[0] || {
    type: 'equals' as const,
    operator: 'equals' as const,
    value: 1,
  };

  const [conditionType, setConditionType] = useState<'exact' | 'range'>(
    condition.operator === 'between' ? 'range' : 'exact'
  );

  const updateCondition = (updates: Partial<ConditionRule>) => {
    const newCondition = { ...condition, ...updates };
    onUpdate({
      ...conditionalLogic,
      conditions: [newCondition],
    });
  };

  // Validate range: min must be <= max
  const isRangeValid = () => {
    if (conditionType !== 'range') return true;
    if (condition.rangeMin === undefined || condition.rangeMax === undefined) return true;
    return condition.rangeMin <= condition.rangeMax;
  };

  return (
    <div className="space-y-3 p-3 border border-border rounded-lg bg-muted/20">
      <Label className="text-sm">Show child fields when:</Label>

      {/* Condition Type Selection */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={conditionType === 'exact' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setConditionType('exact');
            updateCondition({ type: 'equals', operator: 'equals', value: undefined, rangeMin: undefined, rangeMax: undefined });
          }}
          className="flex-1"
        >
          Exact Value
        </Button>
        <Button
          type="button"
          variant={conditionType === 'range' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setConditionType('range');
            updateCondition({ type: 'range', operator: 'between', value: undefined });
          }}
          className="flex-1"
        >
          Range
        </Button>
      </div>

      {/* Exact Value */}
      {conditionType === 'exact' && (
        <div>
          <Label htmlFor="condition-value" className="text-xs">
            Value
          </Label>
          <Input
            id="condition-value"
            type="number"
            placeholder="Enter number"
            defaultValue={condition.value || ''}
            onBlur={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) {
                updateCondition({ value: val });
              }
            }}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Shows when user enters this exact number
          </p>
        </div>
      )}

      {/* Range */}
      {conditionType === 'range' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="condition-min" className="text-xs">
              Min Value
            </Label>
            <Input
              id="condition-min"
              type="number"
              placeholder="Min"
              defaultValue={condition.rangeMin || ''}
              onBlur={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                  updateCondition({ rangeMin: val });
                }
              }}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="condition-max" className="text-xs">
              Max Value
            </Label>
            <Input
              id="condition-max"
              type="number"
              placeholder="Max"
              defaultValue={condition.rangeMax || ''}
              onBlur={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                  updateCondition({ rangeMax: val });
                }
              }}
              className="mt-1"
            />
          </div>
          {!isRangeValid() && (
            <p className="text-xs text-destructive col-span-2">
              Error: Min value must be less than or equal to Max value
            </p>
          )}
          <p className="text-xs text-muted-foreground col-span-2">
            Shows when number is between min and max
          </p>
        </div>
      )}
    </div>
  );
}

// Dropdown Field Condition Editor
function DropdownConditionEditor({
  field: _field,
  conditionalLogic,
  onUpdate,
  allFields,
}: {
  field: FormField;
  conditionalLogic: ConditionalLogic;
  onUpdate: (logic: ConditionalLogic) => void;
  allFields: FormField[];
}) {
  const condition = conditionalLogic.conditions[0] || {
    type: 'optionMatch' as const,
    options: [],
  };

  const [matchType, setMatchType] = useState<'single' | 'multiple'>(
    (condition.options?.length || 0) > 1 ? 'multiple' : 'single'
  );

  // Get the PARENT field to validate options (this is a child field, not the parent!)
  const parentField = allFields.find(f => f.id === conditionalLogic.parentFieldId);

  // Validate that selected options still exist in PARENT field's options
  const validOptions = parentField
    ? (condition.options || []).filter(opt => parentField.options?.includes(opt))
    : condition.options || [];
  const invalidOptions = parentField
    ? (condition.options || []).filter(opt => !parentField.options?.includes(opt))
    : [];
  const selectedOptions = condition.options || [];

  // Auto-fix: Remove invalid options if any (only if parent field exists)
  if (parentField && invalidOptions.length > 0) {
    console.warn('⚠️ Removing invalid options from child field condition:', invalidOptions);
    onUpdate({
      ...conditionalLogic,
      conditions: [{
        ...condition,
        options: validOptions,
      }],
    });
  }

  const handleMatchTypeChange = (newMatchType: 'single' | 'multiple') => {
    setMatchType(newMatchType);
    // Clear options when switching modes to avoid confusion
    onUpdate({
      ...conditionalLogic,
      conditions: [{
        ...condition,
        options: [],
      }],
    });
  };

  const toggleOption = (option: string) => {
    let newOptions: string[];

    if (matchType === 'single') {
      // In single mode, replace entire array with clicked option
      newOptions = selectedOptions.includes(option) ? [] : [option];
    } else {
      // In multiple mode, toggle as before
      newOptions = selectedOptions.includes(option)
        ? selectedOptions.filter(o => o !== option)
        : [...selectedOptions, option];
    }

    onUpdate({
      ...conditionalLogic,
      conditions: [{
        ...condition,
        options: newOptions,
      }],
    });
  };

  return (
    <div className="space-y-3 p-3 border border-border rounded-lg bg-muted/20">
      <Label className="text-sm">Show child fields when user selects:</Label>

      {/* Warning for invalid options */}
      {invalidOptions.length > 0 && (
        <div className="p-2 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded text-xs">
          <p className="text-orange-800 dark:text-orange-200 font-medium">
            Warning: Some options were removed from parent field
          </p>
          <p className="text-orange-600 dark:text-orange-400 mt-1">
            The following options no longer exist: {invalidOptions.join(', ')}
          </p>
        </div>
      )}

      {/* Match Type Selection */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={matchType === 'single' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleMatchTypeChange('single')}
          className="flex-1"
        >
          Single Option
        </Button>
        <Button
          type="button"
          variant={matchType === 'multiple' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleMatchTypeChange('multiple')}
          className="flex-1"
        >
          Any Of Multiple
        </Button>
      </div>

      {/* Option Selection */}
      <div className="space-y-2">
        {!parentField && (
          <div className="p-2 bg-red-50 dark:bg-red-950 border border-red-200 rounded text-xs text-red-800 dark:text-red-200">
            Error: Parent field not found. Cannot configure conditional logic.
          </div>
        )}
        {parentField?.options?.map((option) => (
          <div key={option} className="flex items-center gap-2 p-2 rounded border">
            <input
              type="checkbox"
              id={`option-${option}`}
              checked={selectedOptions.includes(option)}
              onChange={() => toggleOption(option)}
              className="h-4 w-4"
            />
            <Label
              htmlFor={`option-${option}`}
              className="flex-1 text-sm cursor-pointer"
            >
              {option}
            </Label>
          </div>
        ))}
        {parentField && (!parentField.options || parentField.options.length === 0) && (
          <div className="p-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 rounded text-xs text-yellow-800 dark:text-yellow-200">
            Parent field has no options. Add options to the parent field first.
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {matchType === 'single'
          ? 'Select one option that triggers child fields'
          : 'Select options that can trigger child fields (any match)'}
      </p>
    </div>
  );
}

// Checkbox Field Condition Editor
function CheckboxConditionEditor({
  conditionalLogic,
  onUpdate,
}: {
  conditionalLogic: ConditionalLogic;
  onUpdate: (logic: ConditionalLogic) => void;
}) {
  const condition = conditionalLogic.conditions[0] || {
    type: 'checkboxState' as const,
    value: true,
  };

  const updateCondition = (value: boolean) => {
    onUpdate({
      ...conditionalLogic,
      conditions: [{
        ...condition,
        value,
      }],
    });
  };

  return (
    <div className="space-y-3 p-3 border border-border rounded-lg bg-muted/20">
      <Label className="text-sm">Show child fields when checkbox is:</Label>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={condition.value === true ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateCondition(true)}
          className="flex-1"
        >
          Checked
        </Button>
        <Button
          type="button"
          variant={condition.value === false ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateCondition(false)}
          className="flex-1"
        >
          Unchecked
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Child fields will appear when checkbox is {condition.value ? 'checked' : 'unchecked'}
      </p>
    </div>
  );
}
