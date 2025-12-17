import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { UserMultiSelect } from '@/components/ui/user-multi-select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, AlertCircle } from 'lucide-react';
import { getVisibleFieldsInHierarchicalOrder } from '@/utils/conditionalFieldEvaluator';
import { getPriorityColor } from '@/lib/utils';
import type { FormField } from '@/types/formBuilder';
import type { TicketPriority, User } from '@/types';

interface DynamicTicketFormProps {
  // Form configuration
  allFields: FormField[];

  // Controlled state
  fieldValues: Record<string, any>;
  onFieldValueChange: (fieldId: string, value: any) => void;

  // Agent-specific fields
  showRequesterField?: boolean;
  showAssigneeField?: boolean;
  selectedRequesterId?: string;
  onRequesterChange?: (id: string) => void;
  selectedAssigneeId?: string;
  onAssigneeChange?: (id: string) => void;
  users?: User[];

  // CC users (separate from fieldValues for agent forms)
  ccUserIds?: string[];
  onCcUserIdsChange?: (ids: string[]) => void;

  // Submission
  isLoading?: boolean;
  onSubmit: (e: React.FormEvent) => void;

  // Error handling
  errorMessage?: string | null;
}

export function DynamicTicketForm({
  allFields,
  fieldValues,
  onFieldValueChange,
  showRequesterField = false,
  showAssigneeField = false,
  selectedRequesterId = '',
  onRequesterChange,
  selectedAssigneeId = '',
  onAssigneeChange,
  users = [],
  ccUserIds = [],
  onCcUserIdsChange,
  isLoading = false,
  onSubmit,
  errorMessage = null,
}: DynamicTicketFormProps) {
  // Calculate visible fields in hierarchical order (children appear below parents)
  const visibleFields = useMemo(() => {
    return getVisibleFieldsInHierarchicalOrder(allFields, fieldValues);
  }, [allFields, fieldValues]);

  // Handler to remove individual files from selection
  const handleRemoveFile = (fieldId: string, fileIndex: number) => {
    const currentValue = fieldValues[fieldId];
    if (!currentValue) return;

    if (Array.isArray(currentValue)) {
      // Multiple files - remove specific index
      const newFiles = [...currentValue];
      newFiles.splice(fileIndex, 1);
      onFieldValueChange(fieldId, newFiles.length > 0 ? newFiles : null);
    } else {
      // Single file - remove it
      onFieldValueChange(fieldId, null);
    }
  };

  // Render a single form field based on its type
  const renderField = (field: FormField) => {
    const value = fieldValues[field.id];

    // Special handling for CC users field
    if (field.type === 'cc_users') {
      return (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id}>
            {field.label} {field.required && '*'}
          </Label>
          <UserMultiSelect
            users={users}
            selectedUserIds={ccUserIds}
            onChange={onCcUserIdsChange || (() => {})}
            placeholder={field.placeholder || 'Select users to CC...'}
            disabled={isLoading}
          />
          {field.helpText && (
            <p className="text-xs text-muted-foreground">{field.helpText}</p>
          )}
        </div>
      );
    }

    // Handle other field types
    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && '*'}
            </Label>
            <Input
              id={field.id}
              placeholder={field.placeholder}
              value={value || ''}
              onChange={(e) => onFieldValueChange(field.id, e.target.value)}
              required={field.required}
              disabled={isLoading}
              maxLength={field.validation?.maxLength}
            />
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && '*'}
            </Label>
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              value={value || ''}
              onChange={(e) => onFieldValueChange(field.id, e.target.value)}
              required={field.required}
              disabled={isLoading}
              rows={4}
            />
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && '*'}
            </Label>
            <Input
              id={field.id}
              type="number"
              placeholder={field.placeholder}
              value={value || ''}
              onChange={(e) => onFieldValueChange(field.id, e.target.value)}
              required={field.required}
              disabled={isLoading}
              min={field.validation?.min}
              max={field.validation?.max}
            />
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && '*'}
            </Label>
            <Input
              id={field.id}
              type="date"
              value={value || ''}
              onChange={(e) => onFieldValueChange(field.id, e.target.value)}
              required={field.required}
              disabled={isLoading}
            />
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );

      case 'dropdown':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && '*'}
            </Label>
            <Select
              id={field.id}
              value={value || ''}
              onChange={(e) => onFieldValueChange(field.id, e.target.value)}
              required={field.required}
              disabled={isLoading}
            >
              <option value="">{field.placeholder || 'Select an option'}</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );

      case 'multiselect':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && '*'}
            </Label>
            <MultiSelect
              options={field.options || []}
              selectedValues={value || []}
              onChange={(values) => onFieldValueChange(field.id, values)}
              placeholder={field.placeholder || 'Select options...'}
              disabled={isLoading}
            />
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <Checkbox
              id={field.id}
              checked={value || false}
              onChange={(e) => onFieldValueChange(field.id, e.target.checked)}
              required={field.required}
              disabled={isLoading}
              label={field.label + (field.required ? ' *' : '')}
              helperText={field.helpText}
            />
          </div>
        );

      case 'file':
        const fileValidation = field.validation?.fileValidation;
        const isMultiple = fileValidation?.multiple;
        const selectedFiles = value ? (Array.isArray(value) ? value : [value]) : [];

        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && '*'}
            </Label>
            <Input
              id={field.id}
              type="file"
              multiple={isMultiple}
              accept={fileValidation?.accept}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);

                // Validate number of files
                if (isMultiple && fileValidation?.maxFiles && files.length > fileValidation.maxFiles) {
                  alert(`You can only upload up to ${fileValidation.maxFiles} files`);
                  e.target.value = ''; // Reset input
                  return;
                }

                // Validate file sizes
                const maxSize = fileValidation?.maxSize || 10485760; // 10MB default
                const oversizedFiles = files.filter((f) => f.size > maxSize);
                if (oversizedFiles.length > 0) {
                  alert(
                    `Some files exceed the maximum size of ${(maxSize / 1048576).toFixed(0)}MB`
                  );
                  e.target.value = ''; // Reset input
                  return;
                }

                // Store files
                if (isMultiple) {
                  onFieldValueChange(field.id, files); // Array of files
                } else {
                  onFieldValueChange(field.id, files[0]); // Single file
                }
              }}
              required={field.required}
              disabled={isLoading}
              className="cursor-pointer"
            />

            {/* Show selected files with remove buttons */}
            {selectedFiles.length > 0 && (
              <div className="space-y-1 p-2 bg-muted/50 rounded-md">
                {selectedFiles.map((file: File, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-sm group"
                  >
                    <span className="font-medium text-green-600">✓</span>
                    <span className="truncate flex-1">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveFile(field.id, idx)}
                      title="Remove file"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {isMultiple && (
              <p className="text-xs text-muted-foreground">
                You can upload up to {fileValidation?.maxFiles || 5} files (max{' '}
                {((fileValidation?.maxSize || 10485760) / 1048576).toFixed(0)}MB each)
              </p>
            )}

            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );

      case 'priority':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && '*'}
            </Label>
            <div className="flex flex-wrap gap-2">
              {field.options?.map((option) => {
                const normalizedValue = option.toLowerCase() as TicketPriority;
                const isSelected = value === option;

                return (
                  <Badge
                    key={option}
                    variant={isSelected ? 'default' : 'outline'}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? getPriorityColor(normalizedValue) + ' ring-2 ring-offset-2'
                        : 'hover:bg-accent'
                    } ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
                    onClick={() => !isLoading && onFieldValueChange(field.id, option)}
                  >
                    {option}
                  </Badge>
                );
              })}
            </div>
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );

      case 'category':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && '*'}
            </Label>
            <Select
              id={field.id}
              value={value || field.defaultValue || ''}
              onChange={(e) => onFieldValueChange(field.id, e.target.value)}
              required={field.required}
              disabled={isLoading}
            >
              {!field.required && <option value="">{field.placeholder || 'Select category'}</option>}
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Error message */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Agent-only fields */}
      {(showRequesterField || showAssigneeField) && (
        <>
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 space-y-4">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Agent Fields (Not visible to end users)
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Requester dropdown */}
              {showRequesterField && (
                <div className="space-y-2">
                  <Label htmlFor="requester">Requester *</Label>
                  <Select
                    id="requester"
                    value={selectedRequesterId}
                    onChange={(e) => onRequesterChange?.(e.target.value)}
                    required
                    disabled={isLoading}
                  >
                    <option value="">Select requester</option>
                    {users.map((u) => (
                      <option key={u.id} value={String(u.id)}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              {/* Assignee dropdown */}
              {showAssigneeField && (
                <div className="space-y-2">
                  <Label htmlFor="assignee">Assignee (Optional)</Label>
                  <Select
                    id="assignee"
                    value={selectedAssigneeId}
                    onChange={(e) => onAssigneeChange?.(e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="">Unassigned</option>
                    {users
                      .filter((u) => u.role !== 'user')
                      .map((u) => (
                        <option key={u.id} value={String(u.id)}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                  </Select>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-6" />
        </>
      )}

      {/* Dynamic fields from Form Builder */}
      {visibleFields.filter((f) => !f.hidden).map((field) => renderField(field))}

      {/* Submit button */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Ticket'}
        </Button>
      </div>
    </form>
  );
}
