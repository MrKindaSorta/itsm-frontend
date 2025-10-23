import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { FormField, FormFieldType } from '@/types/formBuilder';
import { FIELD_TYPES } from './FieldPalette';
import { Badge } from '@/components/ui/badge';

interface ChildFieldCreationModalProps {
  open: boolean;
  onClose: () => void;
  parentField: FormField;
  onCreateChild: (childField: Partial<FormField>) => void;
}

export default function ChildFieldCreationModal({
  open,
  onClose,
  parentField,
  onCreateChild,
}: ChildFieldCreationModalProps) {
  const [fieldType, setFieldType] = useState<FormFieldType>('text');
  const [label, setLabel] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [required, setRequired] = useState(false);

  const currentNestingLevel = parentField.conditionalLogic?.nestingLevel || 0;
  const childNestingLevel = currentNestingLevel + 1;

  // Filter out field types that don't make sense as child fields
  const availableFieldTypes = FIELD_TYPES.filter(ft =>
    !['cc_users', 'priority', 'category'].includes(ft.type)
  );

  const handleCreate = () => {
    if (!label.trim()) {
      alert('Please enter a field label');
      return;
    }

    const childField: Partial<FormField> = {
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: fieldType,
      label: label.trim(),
      placeholder: placeholder.trim() || undefined,
      required,
      order: 999, // Will be updated by parent
      deletable: true,
      conditionalLogic: {
        enabled: false,
        parentFieldId: parentField.id,
        conditions: [],
        childFields: [],
        nestingLevel: childNestingLevel,
      },
    };

    // Add default options for dropdown/multiselect
    if (fieldType === 'dropdown' || fieldType === 'multiselect') {
      childField.options = ['Option 1', 'Option 2', 'Option 3'];
    }

    onCreateChild(childField);

    // Reset form
    setFieldType('text');
    setLabel('');
    setPlaceholder('');
    setRequired(false);
    onClose();
  };

  const handleCancel = () => {
    // Reset form
    setFieldType('text');
    setLabel('');
    setPlaceholder('');
    setRequired(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Child Field</DialogTitle>
          <DialogDescription>
            Create a new field that appears when conditions are met
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Parent Field Info */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-1">
              <Label className="text-xs text-muted-foreground">Parent Field:</Label>
              <Badge variant="secondary" className="text-xs">
                Level {currentNestingLevel}
              </Badge>
            </div>
            <p className="text-sm font-medium">{parentField.label}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Type: {parentField.type}
            </p>
          </div>

          {/* Nesting Info */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              New Field Level: {childNestingLevel}
            </Badge>
            {childNestingLevel === 2 && (
              <span className="text-orange-600">
                This will be the maximum nesting depth
              </span>
            )}
          </div>

          {/* Field Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="field-type">Field Type *</Label>
            <Select
              id="field-type"
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value as FormFieldType)}
            >
              {availableFieldTypes.map((ft) => (
                <option key={ft.type} value={ft.type}>
                  {ft.icon} {ft.label}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              {availableFieldTypes.find(ft => ft.type === fieldType)?.description}
            </p>
          </div>

          {/* Field Label */}
          <div className="space-y-2">
            <Label htmlFor="field-label">Field Label *</Label>
            <Input
              id="field-label"
              placeholder="e.g., Additional Details"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          {/* Field Placeholder */}
          {fieldType !== 'checkbox' && fieldType !== 'file' && (
            <div className="space-y-2">
              <Label htmlFor="field-placeholder">Placeholder</Label>
              <Input
                id="field-placeholder"
                placeholder="e.g., Enter details here..."
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
              />
            </div>
          )}

          {/* Required Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label htmlFor="field-required" className="font-medium">
                Required Field
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Users must fill this field when visible
              </p>
            </div>
            <button
              id="field-required"
              onClick={() => setRequired(!required)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                required ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  required ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Info Box */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              💡 <strong>Next step:</strong> After creating this field, configure the conditions in the parent field's "Conditional Logic" section to specify when this child field should appear.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!label.trim()}>
            Create Child Field
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
