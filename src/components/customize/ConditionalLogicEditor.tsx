import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { FormField, ConditionRule, ConditionalLogic } from '@/types/formBuilder';
import { Zap, ChevronRight, AlertTriangle } from 'lucide-react';
import { formatConditionSummary } from '@/utils/conditionalLogicFormatters';

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

  // Determine field context
  const isChildField = !!conditionalLogic.parentFieldId;
  const parentField = isChildField
    ? allFields.find(f => f.id === conditionalLogic.parentFieldId)
    : null;
  const parentFieldType = parentField?.type;

  // Check if THIS field can have children (act as a parent)
  const canBeParent = ['number', 'dropdown', 'checkbox', 'category', 'multiselect'].includes(field.type);

  // Calculate current nesting level
  const currentLevel = conditionalLogic.nestingLevel || 0;
  const canAddChildren = currentLevel < 2 && canBeParent;

  // Get child fields of THIS field
  const childFields = allFields.filter(f =>
    conditionalLogic.childFields?.includes(f.id)
  );

  // Sync enabled state with prop
  useEffect(() => {
    setIsEnabled(conditionalLogic.enabled);
  }, [conditionalLogic.enabled]);

  const toggleEnabled = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    onUpdate({
      ...conditionalLogic,
      enabled: newEnabled,
    });
  };

  // For ROOT fields that can't be parents, show nothing
  if (!isChildField && !canBeParent) {
    return (
      <div className="p-4 border border-border rounded-lg bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          Conditional logic is not available for {field.type} fields.
        </p>
        <p className="text-xs text-muted-foreground text-center mt-1">
          Only Number, Dropdown, Checkbox, Category, and Multiselect fields can have conditional children.
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
              {isChildField
                ? 'Configure when this field appears'
                : 'Allow child fields based on this field\'s value'}
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
            {currentLevel === 0 && <span>Root field (always visible)</span>}
            {currentLevel === 1 && <span>Child field</span>}
            {currentLevel === 2 && <span>Grandchild field (max depth)</span>}
          </div>

          {/* CHILD FIELD: Show condition configuration based on PARENT's type */}
          {isChildField && parentField && (
            <>
              <div className="text-sm font-medium flex items-center gap-2">
                <span>Show when</span>
                <Badge variant="secondary">{parentField.label}</Badge>
                <span>matches:</span>
              </div>

              {parentFieldType === 'number' && (
                <NumberConditionEditor
                  parentField={parentField}
                  conditionalLogic={conditionalLogic}
                  onUpdate={onUpdate}
                />
              )}

              {(parentFieldType === 'dropdown' || parentFieldType === 'category' || parentFieldType === 'multiselect') && (
                <DropdownConditionEditor
                  parentField={parentField}
                  conditionalLogic={conditionalLogic}
                  onUpdate={onUpdate}
                />
              )}

              {parentFieldType === 'checkbox' && (
                <CheckboxConditionEditor
                  conditionalLogic={conditionalLogic}
                  onUpdate={onUpdate}
                />
              )}
            </>
          )}

          {/* CHILD FIELD: Parent not found error */}
          {isChildField && !parentField && (
            <div className="p-3 border border-destructive/50 rounded-lg bg-destructive/10">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive font-medium">Parent field not found</p>
              </div>
              <p className="text-xs text-destructive/80 mt-1">
                The parent field has been deleted. This field will remain hidden.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  onUpdate({
                    ...conditionalLogic,
                    enabled: false,
                    parentFieldId: undefined,
                    conditions: [],
                    nestingLevel: 0,
                  });
                }}
              >
                Convert to Root Field
              </Button>
            </div>
          )}

          {/* ROOT FIELD: Explanation (no conditions to configure) */}
          {!isChildField && (
            <div className="p-3 border border-border rounded-lg bg-muted/20 text-sm">
              <p className="font-medium">This is a root field</p>
              <p className="text-muted-foreground mt-1">
                Root fields are always visible. Add child fields to create conditional visibility.
              </p>
              <p className="text-muted-foreground mt-1">
                When you add a child field, you'll configure what value of this field triggers showing the child.
              </p>
            </div>
          )}

          {/* Child Fields List (for fields that CAN be parents) */}
          {canBeParent && (
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Child Fields</Label>
                {!canAddChildren && currentLevel >= 2 && (
                  <Badge variant="outline" className="text-xs text-orange-600">
                    Max depth reached
                  </Badge>
                )}
              </div>

              {childFields.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-md">
                  <p className="mb-1">No child fields added yet</p>
                  <p className="text-[10px]">
                    Click "Add Child" on this field in the list view
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
                          {child.type} · {formatConditionSummary(child.conditionalLogic?.conditions[0])}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================
// Number Condition Editor
// ============================================
interface NumberConditionEditorProps {
  parentField: FormField;
  conditionalLogic: ConditionalLogic;
  onUpdate: (logic: ConditionalLogic) => void;
}

function NumberConditionEditor({
  parentField,
  conditionalLogic,
  onUpdate,
}: NumberConditionEditorProps) {
  const condition = conditionalLogic.conditions[0] || {
    type: 'equals' as const,
    operator: 'equals' as const,
    value: undefined,
  };

  // Determine initial condition type from operator
  const getInitialType = () => {
    if (condition.operator === 'between') return 'range';
    if (condition.operator === 'greaterThan') return 'greaterThan';
    if (condition.operator === 'lessThan') return 'lessThan';
    return 'exact';
  };

  const [conditionType, setConditionType] = useState<'exact' | 'range' | 'greaterThan' | 'lessThan'>(getInitialType);

  // Local state for controlled inputs
  const [localValue, setLocalValue] = useState<string>(
    condition.value !== undefined ? String(condition.value) : ''
  );
  const [localMin, setLocalMin] = useState<string>(
    condition.rangeMin !== undefined ? String(condition.rangeMin) : ''
  );
  const [localMax, setLocalMax] = useState<string>(
    condition.rangeMax !== undefined ? String(condition.rangeMax) : ''
  );

  // Sync local state with external changes
  useEffect(() => {
    if (condition.value !== undefined) {
      setLocalValue(String(condition.value));
    }
  }, [condition.value]);

  useEffect(() => {
    if (condition.rangeMin !== undefined) {
      setLocalMin(String(condition.rangeMin));
    }
  }, [condition.rangeMin]);

  useEffect(() => {
    if (condition.rangeMax !== undefined) {
      setLocalMax(String(condition.rangeMax));
    }
  }, [condition.rangeMax]);

  const updateCondition = (updates: Partial<ConditionRule>) => {
    const newCondition = { ...condition, ...updates };
    onUpdate({
      ...conditionalLogic,
      conditions: [newCondition],
    });
  };

  const handleTypeChange = (newType: 'exact' | 'range' | 'greaterThan' | 'lessThan') => {
    setConditionType(newType);
    setLocalValue('');
    setLocalMin('');
    setLocalMax('');

    switch (newType) {
      case 'exact':
        updateCondition({ type: 'equals', operator: 'equals', value: undefined, rangeMin: undefined, rangeMax: undefined });
        break;
      case 'range':
        updateCondition({ type: 'range', operator: 'between', value: undefined, rangeMin: undefined, rangeMax: undefined });
        break;
      case 'greaterThan':
        updateCondition({ type: 'equals', operator: 'greaterThan', value: undefined, rangeMin: undefined, rangeMax: undefined });
        break;
      case 'lessThan':
        updateCondition({ type: 'equals', operator: 'lessThan', value: undefined, rangeMin: undefined, rangeMax: undefined });
        break;
    }
  };

  const isRangeValid = () => {
    if (conditionType !== 'range') return true;
    if (localMin === '' || localMax === '') return true;
    return parseFloat(localMin) <= parseFloat(localMax);
  };

  return (
    <div className="space-y-3 p-3 border border-border rounded-lg bg-muted/20">
      <Label className="text-sm">
        Show when <strong>{parentField.label}</strong> is:
      </Label>

      {/* Condition Type Selection */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={conditionType === 'exact' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTypeChange('exact')}
        >
          Equals
        </Button>
        <Button
          type="button"
          variant={conditionType === 'range' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTypeChange('range')}
        >
          Between
        </Button>
        <Button
          type="button"
          variant={conditionType === 'greaterThan' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTypeChange('greaterThan')}
        >
          Greater Than
        </Button>
        <Button
          type="button"
          variant={conditionType === 'lessThan' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTypeChange('lessThan')}
        >
          Less Than
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
            placeholder="Enter exact number"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) {
                updateCondition({ value: val });
              }
            }}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Shows when user enters exactly this number
          </p>
        </div>
      )}

      {/* Greater Than */}
      {conditionType === 'greaterThan' && (
        <div>
          <Label htmlFor="condition-gt-value" className="text-xs">
            Value
          </Label>
          <Input
            id="condition-gt-value"
            type="number"
            placeholder="Greater than..."
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) {
                updateCondition({ value: val });
              }
            }}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Shows when value is greater than {localValue || '?'}
          </p>
        </div>
      )}

      {/* Less Than */}
      {conditionType === 'lessThan' && (
        <div>
          <Label htmlFor="condition-lt-value" className="text-xs">
            Value
          </Label>
          <Input
            id="condition-lt-value"
            type="number"
            placeholder="Less than..."
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) {
                updateCondition({ value: val });
              }
            }}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Shows when value is less than {localValue || '?'}
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
              value={localMin}
              onChange={(e) => setLocalMin(e.target.value)}
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
              value={localMax}
              onChange={(e) => setLocalMax(e.target.value)}
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
            Shows when number is between {localMin || '?'} and {localMax || '?'} (inclusive)
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// Dropdown Condition Editor
// ============================================
interface DropdownConditionEditorProps {
  parentField: FormField;
  conditionalLogic: ConditionalLogic;
  onUpdate: (logic: ConditionalLogic) => void;
}

function DropdownConditionEditor({
  parentField,
  conditionalLogic,
  onUpdate,
}: DropdownConditionEditorProps) {
  const condition = conditionalLogic.conditions[0] || {
    type: 'optionMatch' as const,
    options: [],
  };

  const [matchType, setMatchType] = useState<'single' | 'multiple'>(
    (condition.options?.length || 0) > 1 ? 'multiple' : 'single'
  );

  const selectedOptions = condition.options || [];
  const parentOptions = parentField.options || [];

  // Validate selected options against current parent options
  const validOptions = selectedOptions.filter(opt => parentOptions.includes(opt));
  const invalidOptions = selectedOptions.filter(opt => !parentOptions.includes(opt));

  // Auto-fix invalid options (in useEffect to avoid render-time state updates)
  useEffect(() => {
    if (invalidOptions.length > 0 && parentOptions.length > 0) {
      console.warn('⚠️ Removing invalid options from condition:', invalidOptions);
      onUpdate({
        ...conditionalLogic,
        conditions: [{
          ...condition,
          options: validOptions,
        }],
      });
    }
  }, [parentOptions.join(',')]); // Only run when parent options change

  const handleMatchTypeChange = (newMatchType: 'single' | 'multiple') => {
    setMatchType(newMatchType);
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
      newOptions = selectedOptions.includes(option) ? [] : [option];
    } else {
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
      <Label className="text-sm">
        Show when <strong>{parentField.label}</strong> is:
      </Label>

      {/* Warning for invalid options */}
      {invalidOptions.length > 0 && (
        <div className="p-2 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded text-xs">
          <p className="text-orange-800 dark:text-orange-200 font-medium">
            Some options were removed from parent
          </p>
          <p className="text-orange-600 dark:text-orange-400 mt-1">
            Removed: {invalidOptions.join(', ')}
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
        {parentOptions.length === 0 ? (
          <div className="p-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 rounded text-xs text-yellow-800 dark:text-yellow-200">
            Parent field has no options. Add options to "{parentField.label}" first.
          </div>
        ) : (
          parentOptions.map((option) => (
            <div key={option} className="flex items-center gap-2 p-2 rounded border hover:bg-muted/50">
              <input
                type={matchType === 'single' ? 'radio' : 'checkbox'}
                id={`option-${option}`}
                name="condition-option"
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
          ))
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {matchType === 'single'
          ? 'Field appears when user selects this exact option'
          : 'Field appears when user selects ANY of the checked options'}
      </p>
    </div>
  );
}

// ============================================
// Checkbox Condition Editor
// ============================================
interface CheckboxConditionEditorProps {
  conditionalLogic: ConditionalLogic;
  onUpdate: (logic: ConditionalLogic) => void;
}

function CheckboxConditionEditor({
  conditionalLogic,
  onUpdate,
}: CheckboxConditionEditorProps) {
  const condition = conditionalLogic.conditions[0] || {
    type: 'checkboxState' as const,
    value: true,
  };

  const updateCondition = (value: boolean) => {
    onUpdate({
      ...conditionalLogic,
      conditions: [{
        type: 'checkboxState',
        value,
      }],
    });
  };

  return (
    <div className="space-y-3 p-3 border border-border rounded-lg bg-muted/20">
      <Label className="text-sm">Show when checkbox is:</Label>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={condition.value === true ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateCondition(true)}
          className="flex-1"
        >
          ✓ Checked
        </Button>
        <Button
          type="button"
          variant={condition.value === false ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateCondition(false)}
          className="flex-1"
        >
          ☐ Unchecked
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Field appears when checkbox is {condition.value ? 'checked' : 'unchecked'}
      </p>
    </div>
  );
}
