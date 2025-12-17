import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { FormField, ConditionalLogic } from '@/types/formBuilder';
import ConditionalLogicEditor from './ConditionalLogicEditor';
import { X, Plus, AlertCircle } from 'lucide-react';

interface FieldPropertiesDrawerProps {
  isOpen: boolean;
  field: FormField | null;
  allFields?: FormField[];
  onFieldUpdate: (updatedField: FormField) => void;
  onClose: () => void;
}

export default function FieldPropertiesDrawer({
  isOpen,
  field,
  allFields = [],
  onFieldUpdate,
  onClose,
}: FieldPropertiesDrawerProps) {
  const [localField, setLocalField] = useState<FormField | null>(field);
  const [isDirty, setIsDirty] = useState(false);

  // Update local field when prop changes
  useEffect(() => {
    setLocalField(field);
    setIsDirty(false);
  }, [field]);

  // Update field (no auto-save, requires manual save button click)
  const updateField = useCallback(
    (updates: Partial<FormField>) => {
      if (!localField) return;
      const updated = { ...localField, ...updates };
      setLocalField(updated);
      setIsDirty(true);
    },
    [localField]
  );

  // Manual save handler
  const handleSave = () => {
    if (!localField) return;
    onFieldUpdate(localField);
    setIsDirty(false);
  };

  // Handle close with unsaved changes warning
  const handleClose = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Close anyway?'
      );
      if (!confirmed) return;
    }
    onClose();
  };

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Options management
  const handleAddOption = () => {
    if (!localField) return;
    const currentOptions = localField.options || [];
    updateField({
      options: [...currentOptions, `Option ${currentOptions.length + 1}`],
    });
  };

  const handleRemoveOption = (index: number) => {
    if (!localField) return;
    const currentOptions = localField.options || [];
    updateField({
      options: currentOptions.filter((_, i) => i !== index),
    });
  };

  const handleUpdateOption = (index: number, value: string) => {
    if (!localField) return;
    const currentOptions = [...(localField.options || [])];
    currentOptions[index] = value;
    updateField({ options: currentOptions });
  };

  if (!isOpen) return null;

  const showOptions =
    localField &&
    (localField.type === 'dropdown' ||
      localField.type === 'multiselect' ||
      localField.type === 'priority' ||
      localField.type === 'category');

  const isSystemField = localField?.isSystemField && localField?.deletable === false;

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full lg:w-[400px] bg-background border-l border-border shadow-xl
          transform transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h2 className="text-lg font-semibold">Field Settings</h2>
              {isDirty && (
                <div className="flex items-center gap-1.5 mt-1">
                  <AlertCircle className="h-3 w-3 text-orange-500" />
                  <span className="text-xs text-orange-500">Unsaved changes</span>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Body - Scrollable Content */}
          {localField && (
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Field Type Badge */}
              <div>
                <Label className="text-xs text-muted-foreground">Field Type</Label>
                <div className="mt-1.5">
                  <Badge variant="secondary" className="font-mono">
                    {localField.type}
                  </Badge>
                  {isSystemField && (
                    <Badge variant="outline" className="ml-2">
                      System Field
                    </Badge>
                  )}
                </div>
              </div>

              {isSystemField && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                  <p className="text-xs text-yellow-800">
                    <strong>System field:</strong> Only label and requirement can be edited.
                  </p>
                </div>
              )}

              {/* Label */}
              <div>
                <Label htmlFor="drawer-field-label">Label *</Label>
                <Input
                  id="drawer-field-label"
                  value={localField.label}
                  onChange={(e) => updateField({ label: e.target.value })}
                  placeholder="Enter field label"
                  className="mt-1.5"
                />
              </div>

              {/* Placeholder */}
              {!isSystemField &&
                localField.type !== 'checkbox' &&
                localField.type !== 'file' && (
                  <div>
                    <Label htmlFor="drawer-field-placeholder">Placeholder</Label>
                    <Input
                      id="drawer-field-placeholder"
                      value={localField.placeholder || ''}
                      onChange={(e) => updateField({ placeholder: e.target.value })}
                      placeholder="Enter placeholder text"
                      className="mt-1.5"
                    />
                  </div>
                )}

              {/* Help Text */}
              {!isSystemField && (
                <div>
                  <Label htmlFor="drawer-field-help">Help Text</Label>
                  <Input
                    id="drawer-field-help"
                    value={localField.helpText || ''}
                    onChange={(e) => updateField({ helpText: e.target.value })}
                    placeholder="Additional guidance for users"
                    className="mt-1.5"
                  />
                </div>
              )}

              {/* Required Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <Label htmlFor="drawer-field-required" className="font-medium">
                    Required Field
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Users must fill this field
                  </p>
                </div>
                <button
                  id="drawer-field-required"
                  onClick={() => updateField({ required: !localField.required })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localField.required ? 'bg-primary' : 'bg-muted'
                  }`}
                  aria-checked={localField.required}
                  role="switch"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localField.required ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Default Value */}
              {!isSystemField &&
                (localField.type === 'checkbox' ? (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <Label htmlFor="drawer-field-default" className="font-medium">
                        Default Checked
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Checkbox starts checked
                      </p>
                    </div>
                    <button
                      id="drawer-field-default"
                      onClick={() =>
                        updateField({ defaultValue: !localField.defaultValue })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        localField.defaultValue ? 'bg-primary' : 'bg-muted'
                      }`}
                      aria-checked={Boolean(localField.defaultValue)}
                      role="switch"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          localField.defaultValue ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ) : (
                  localField.type !== 'file' && (
                    <div>
                      <Label htmlFor="drawer-field-default">Default Value</Label>
                      <Input
                        id="drawer-field-default"
                        type={localField.type === 'number' ? 'number' : 'text'}
                        value={localField.defaultValue || ''}
                        onChange={(e) => updateField({ defaultValue: e.target.value })}
                        placeholder="Default value"
                        className="mt-1.5"
                      />
                    </div>
                  )
                ))}

              {/* Options (for dropdown and multiselect) */}
              {!isSystemField && showOptions && (
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
                          <span className="sr-only">Remove option</span>
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
              {!isSystemField &&
                (localField.type === 'text' || localField.type === 'number') && (
                  <div className="pt-4 border-t border-border">
                    <Label className="text-sm font-medium mb-3 block">
                      Validation
                    </Label>
                    <div className="space-y-3">
                      {localField.type === 'text' && (
                        <div>
                          <Label htmlFor="drawer-field-maxlength" className="text-xs">
                            Max Length
                          </Label>
                          <Input
                            id="drawer-field-maxlength"
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
                            <Label htmlFor="drawer-field-min" className="text-xs">
                              Minimum Value
                            </Label>
                            <Input
                              id="drawer-field-min"
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
                            <Label htmlFor="drawer-field-max" className="text-xs">
                              Maximum Value
                            </Label>
                            <Input
                              id="drawer-field-max"
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

              {/* File Upload Options */}
              {!isSystemField && localField.type === 'file' && (
                <div className="pt-4 border-t border-border">
                  <Label className="text-sm font-medium mb-3 block">
                    File Upload Options
                  </Label>
                  <div className="space-y-3">
                    {/* Upload Mode Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div>
                        <Label className="font-medium">Multiple Files</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Allow users to upload multiple files at once
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updateField({
                            validation: {
                              ...localField.validation,
                              fileValidation: {
                                ...localField.validation?.fileValidation,
                                multiple: !localField.validation?.fileValidation?.multiple,
                                maxFiles: localField.validation?.fileValidation?.multiple ? 1 : 5,
                              },
                            },
                          })
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          localField.validation?.fileValidation?.multiple
                            ? 'bg-primary'
                            : 'bg-muted'
                        }`}
                        aria-checked={Boolean(localField.validation?.fileValidation?.multiple)}
                        role="switch"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            localField.validation?.fileValidation?.multiple
                              ? 'translate-x-6'
                              : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Max File Size */}
                    <div>
                      <Label htmlFor="file-max-size" className="text-xs">
                        Max File Size (MB)
                      </Label>
                      <Input
                        id="file-max-size"
                        type="number"
                        value={
                          localField.validation?.fileValidation?.maxSize
                            ? localField.validation.fileValidation.maxSize / 1048576
                            : 10
                        }
                        onChange={(e) => {
                          const sizeInMB = parseInt(e.target.value) || 10;
                          updateField({
                            validation: {
                              ...localField.validation,
                              fileValidation: {
                                ...localField.validation?.fileValidation,
                                maxSize: sizeInMB * 1048576,
                              },
                            },
                          });
                        }}
                        placeholder="10"
                        min="1"
                        max="100"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum size per file (1-100 MB)
                      </p>
                    </div>

                    {/* Max Number of Files (only if multiple is enabled) */}
                    {localField.validation?.fileValidation?.multiple && (
                      <div>
                        <Label htmlFor="file-max-count" className="text-xs">
                          Max Number of Files
                        </Label>
                        <Input
                          id="file-max-count"
                          type="number"
                          value={localField.validation?.fileValidation?.maxFiles || 5}
                          onChange={(e) => {
                            const maxFiles = parseInt(e.target.value) || 5;
                            updateField({
                              validation: {
                                ...localField.validation,
                                fileValidation: {
                                  ...localField.validation?.fileValidation,
                                  maxFiles,
                                },
                              },
                            });
                          }}
                          placeholder="5"
                          min="1"
                          max="20"
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Maximum number of files users can upload (1-20)
                        </p>
                      </div>
                    )}

                    {/* Accept Attribute (File Type Filter) */}
                    <div>
                      <Label htmlFor="file-accept" className="text-xs">
                        Allowed File Types
                      </Label>
                      <Input
                        id="file-accept"
                        type="text"
                        value={localField.validation?.fileValidation?.accept || ''}
                        onChange={(e) =>
                          updateField({
                            validation: {
                              ...localField.validation,
                              fileValidation: {
                                ...localField.validation?.fileValidation,
                                accept: e.target.value,
                              },
                            },
                          })
                        }
                        placeholder="e.g., image/*,.pdf,.doc,.docx"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Leave empty for all types. Examples: image/*, .pdf, .doc
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Logic */}
              {!isSystemField && (
                <div className="pt-4 border-t border-border">
                  <Label className="text-sm font-medium mb-3 block">
                    Conditional Logic
                  </Label>
                  <ConditionalLogicEditor
                    field={localField}
                    allFields={allFields}
                    onUpdate={(conditionalLogic: ConditionalLogic) =>
                      updateField({ conditionalLogic })
                    }
                  />
                </div>
              )}
            </div>
          )}

          {/* Footer with Save/Cancel buttons */}
          {localField && (
            <div className="px-6 py-4 border-t border-border bg-muted/20">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  {isDirty ? (
                    <span className="text-orange-600 font-medium">Unsaved changes</span>
                  ) : (
                    <span className="text-green-600">All changes saved</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleClose} size="sm">
                    {isDirty ? 'Cancel' : 'Close'}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!isDirty}
                    size="sm"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
