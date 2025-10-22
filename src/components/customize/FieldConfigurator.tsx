import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { FormField } from '@/types/formBuilder';
import { X, Plus } from 'lucide-react';

interface FieldConfiguratorProps {
  field: FormField | null;
  onFieldUpdate: (updatedField: FormField) => void;
  onClose: () => void;
}

export default function FieldConfigurator({
  field,
  onFieldUpdate,
  onClose,
}: FieldConfiguratorProps) {
  const [localField, setLocalField] = useState<FormField | null>(field);

  useEffect(() => {
    setLocalField(field);
  }, [field]);

  if (!localField) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Field Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-sm text-muted-foreground">
              Select a field from the canvas to configure its properties
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const updateField = (updates: Partial<FormField>) => {
    const updated = { ...localField, ...updates };
    setLocalField(updated);
    onFieldUpdate(updated);
  };

  const handleAddOption = () => {
    const currentOptions = localField.options || [];
    updateField({
      options: [...currentOptions, `Option ${currentOptions.length + 1}`],
    });
  };

  const handleRemoveOption = (index: number) => {
    const currentOptions = localField.options || [];
    updateField({
      options: currentOptions.filter((_, i) => i !== index),
    });
  };

  const handleUpdateOption = (index: number, value: string) => {
    const currentOptions = [...(localField.options || [])];
    currentOptions[index] = value;
    updateField({ options: currentOptions });
  };

  const showOptions = localField.type === 'dropdown' || localField.type === 'multiselect' || localField.type === 'priority' || localField.type === 'category';

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">Field Properties</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Configure the selected field
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-4">
        {/* Field Type Badge */}
        <div>
          <Label className="text-xs text-muted-foreground">Field Type</Label>
          <div className="mt-1">
            <Badge variant="secondary">{localField.type}</Badge>
          </div>
        </div>

        {/* Label */}
        <div>
          <Label htmlFor="field-label">Label *</Label>
          <Input
            id="field-label"
            value={localField.label}
            onChange={(e) => updateField({ label: e.target.value })}
            placeholder="Enter field label"
            className="mt-1.5"
          />
        </div>

        {/* Placeholder */}
        {localField.type !== 'checkbox' && localField.type !== 'file' && (
          <div>
            <Label htmlFor="field-placeholder">Placeholder</Label>
            <Input
              id="field-placeholder"
              value={localField.placeholder || ''}
              onChange={(e) => updateField({ placeholder: e.target.value })}
              placeholder="Enter placeholder text"
              className="mt-1.5"
            />
          </div>
        )}

        {/* Help Text */}
        <div>
          <Label htmlFor="field-help">Help Text</Label>
          <Input
            id="field-help"
            value={localField.helpText || ''}
            onChange={(e) => updateField({ helpText: e.target.value })}
            placeholder="Additional guidance for users"
            className="mt-1.5"
          />
        </div>

        {/* Required Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <div>
            <Label htmlFor="field-required" className="font-medium">
              Required Field
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Users must fill this field
            </p>
          </div>
          <button
            id="field-required"
            onClick={() => updateField({ required: !localField.required })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              localField.required ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                localField.required ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Default Value */}
        {localField.type === 'checkbox' ? (
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <Label htmlFor="field-default" className="font-medium">
                Default Checked
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Checkbox starts checked
              </p>
            </div>
            <button
              id="field-default"
              onClick={() =>
                updateField({ defaultValue: !localField.defaultValue })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localField.defaultValue ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localField.defaultValue ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ) : localField.type !== 'file' && (
          <div>
            <Label htmlFor="field-default">Default Value</Label>
            <Input
              id="field-default"
              type={localField.type === 'number' ? 'number' : 'text'}
              value={localField.defaultValue || ''}
              onChange={(e) => updateField({ defaultValue: e.target.value })}
              placeholder="Default value"
              className="mt-1.5"
            />
          </div>
        )}

        {/* Options (for dropdown and multiselect) */}
        {showOptions && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Options</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="h-7 gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Option
              </Button>
            </div>
            <div className="space-y-2">
              {localField.options?.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(e) => handleUpdateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(index)}
                    className="h-9 w-9 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {(!localField.options || localField.options.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-md">
                  No options added yet
                </p>
              )}
            </div>
          </div>
        )}

        {/* Validation Rules */}
        {(localField.type === 'text' || localField.type === 'number') && (
          <div className="pt-4 border-t border-border">
            <Label className="text-sm font-medium mb-3 block">Validation</Label>
            <div className="space-y-3">
              {localField.type === 'text' && (
                <div>
                  <Label htmlFor="field-maxlength" className="text-xs">
                    Max Length
                  </Label>
                  <Input
                    id="field-maxlength"
                    type="number"
                    value={localField.validation?.maxLength || ''}
                    onChange={(e) =>
                      updateField({
                        validation: {
                          ...localField.validation,
                          maxLength: parseInt(e.target.value) || undefined,
                        },
                      })
                    }
                    placeholder="Maximum characters"
                    className="mt-1"
                  />
                </div>
              )}
              {localField.type === 'number' && (
                <>
                  <div>
                    <Label htmlFor="field-min" className="text-xs">
                      Minimum Value
                    </Label>
                    <Input
                      id="field-min"
                      type="number"
                      value={localField.validation?.min || ''}
                      onChange={(e) =>
                        updateField({
                          validation: {
                            ...localField.validation,
                            min: parseInt(e.target.value) || undefined,
                          },
                        })
                      }
                      placeholder="Min value"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="field-max" className="text-xs">
                      Maximum Value
                    </Label>
                    <Input
                      id="field-max"
                      type="number"
                      value={localField.validation?.max || ''}
                      onChange={(e) =>
                        updateField({
                          validation: {
                            ...localField.validation,
                            max: parseInt(e.target.value) || undefined,
                          },
                        })
                      }
                      placeholder="Max value"
                      className="mt-1"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
