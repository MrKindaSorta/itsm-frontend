import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { FormField } from '@/types/formBuilder';
import { cn } from '@/lib/utils';
import { evaluateFieldVisibility, getFieldsToHide } from '@/utils/conditionalFieldEvaluator';

interface FormPreviewModeProps {
  fields: FormField[];
}

export default function FormPreviewMode({ fields }: FormPreviewModeProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  // Helper function to update a field value and clear hidden child fields
  const updateFieldValue = (fieldId: string, value: any) => {
    const field = fields.find(f => f.id === fieldId);
    console.log(`\n🔄 [VALUE CHANGE] Field: ${field?.label || fieldId}`);
    console.log(`   Old value:`, formValues[fieldId]);
    console.log(`   New value:`, value);

    const newFormValues = { ...formValues, [fieldId]: value };

    // Find fields that should be hidden due to this change
    console.log(`   🔍 Checking for fields to hide...`);
    const fieldsToHide = getFieldsToHide(fields, newFormValues, fieldId);

    if (fieldsToHide.length > 0) {
      console.log(`   🚫 Hiding ${fieldsToHide.length} field(s):`, fieldsToHide.map(id => {
        const f = fields.find(field => field.id === id);
        return `${f?.label} (${id})`;
      }));

      // Remove values for hidden fields
      fieldsToHide.forEach(hiddenFieldId => {
        delete newFormValues[hiddenFieldId];
      });
    } else {
      console.log(`   ✅ No fields to hide`);
    }

    console.log(`   📊 Updated form values:`, newFormValues);
    setFormValues(newFormValues);
  };

  // Filter to visible fields only (not hidden and conditional logic satisfied)
  console.log('\n🎨 [RENDER] FormPreviewMode - Filtering visible fields');
  console.log(`   Total fields: ${fields.length}`);
  console.log(`   Current form values:`, formValues);

  const visibleFields = fields.filter((f) => {
    const isHidden = f.hidden;
    const meetsConditions = evaluateFieldVisibility(f, fields, formValues);
    const isVisible = !isHidden && meetsConditions;

    if (!isVisible) {
      console.log(`   👻 HIDDEN: ${f.label} (hidden=${isHidden}, meetsConditions=${meetsConditions})`);
    }

    return isVisible;
  });

  console.log(`   ✅ Visible fields: ${visibleFields.length}/${fields.length}`, visibleFields.map(f => f.label));

  // Empty state
  if (fields.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] text-center p-6">
        <div>
          <p className="text-muted-foreground mb-2">No fields to preview</p>
          <p className="text-sm text-muted-foreground">
            Add fields in List View to see the preview
          </p>
        </div>
      </div>
    );
  }

  // Render individual form field
  const renderField = (field: FormField) => {
    const fieldId = `preview-${field.id}`;

    switch (field.type) {
      case 'text':
        return (
          <Input
            id={fieldId}
            placeholder={field.placeholder}
            defaultValue={field.defaultValue}
            required={field.required}
            maxLength={field.validation?.maxLength}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={fieldId}
            placeholder={field.placeholder}
            defaultValue={field.defaultValue}
            required={field.required}
            maxLength={field.validation?.maxLength}
            className="min-h-[100px]"
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
          />
        );

      case 'number':
        return (
          <Input
            id={fieldId}
            type="number"
            placeholder={field.placeholder}
            defaultValue={field.defaultValue}
            required={field.required}
            min={field.validation?.min}
            max={field.validation?.max}
            onChange={(e) => {
              // Convert empty string to null to properly hide conditional children
              // parseFloat(null) returns NaN, which evaluateNumberCondition handles correctly
              const value = e.target.value === '' ? null : parseFloat(e.target.value);
              updateFieldValue(field.id, value);
            }}
          />
        );

      case 'date':
        return (
          <Input
            id={fieldId}
            type="date"
            defaultValue={field.defaultValue}
            required={field.required}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
          />
        );

      case 'dropdown':
      case 'priority':
      case 'category':
        return (
          <Select
            id={fieldId}
            defaultValue={field.defaultValue}
            required={field.required}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
          >
            <option value="">{field.placeholder || 'Select...'}</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        );

      case 'multiselect':
        return (
          <Select
            id={fieldId}
            multiple
            required={field.required}
            className="min-h-[100px]"
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
              updateFieldValue(field.id, selected);
            }}
          >
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <input
              id={fieldId}
              type="checkbox"
              defaultChecked={field.defaultValue}
              required={field.required}
              className="h-4 w-4 rounded border-input"
              onChange={(e) => updateFieldValue(field.id, e.target.checked)}
            />
            <Label htmlFor={fieldId} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          </div>
        );

      case 'file':
        const fileValidation = field.validation?.fileValidation;
        return (
          <div className="space-y-2">
            <Input
              id={fieldId}
              type="file"
              required={field.required}
              multiple={fileValidation?.multiple}
              accept={fileValidation?.accept}
            />
            {fileValidation?.multiple && (
              <p className="text-xs text-muted-foreground">
                Multiple files allowed (max {fileValidation.maxFiles || 5} files,{' '}
                {fileValidation.maxSize
                  ? `${(fileValidation.maxSize / 1048576).toFixed(0)}MB each`
                  : '10MB each'}
                )
              </p>
            )}
          </div>
        );

      case 'cc_users':
        return (
          <Input
            id={fieldId}
            placeholder={field.placeholder || 'Select users to CC...'}
            required={field.required}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-background border rounded-lg p-6 space-y-6">
        {/* Preview Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Form Preview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            This is how users will see your form. Interact with conditional fields to see them
            appear dynamically.
          </p>
        </div>

        {/* Form Fields */}
        {visibleFields.map((field) => (
          <div
            key={field.id}
            className={cn(
              'space-y-2',
              field.conditionalLogic?.nestingLevel &&
                field.conditionalLogic.nestingLevel > 0 &&
                'ml-6 pl-4 border-l-2 border-primary/30'
            )}
          >
            {/* Label (except for checkbox which has inline label) */}
            {field.type !== 'checkbox' && (
              <Label htmlFor={`preview-${field.id}`}>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
            )}

            {/* Form Control */}
            {renderField(field)}

            {/* Help Text */}
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        ))}

        {/* Empty state for when all fields are hidden */}
        {visibleFields.length === 0 && fields.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>All fields are currently hidden</p>
            <p className="text-sm mt-1">Adjust field visibility in List View</p>
          </div>
        )}
      </div>
    </div>
  );
}
