import { useState, type DragEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { FormField } from '@/types/formBuilder';
import { GripVertical, Settings, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormFieldItemProps {
  field: FormField;
  isSelected: boolean;
  isDragging: boolean;
  showConditionalIndicators: boolean;
  onSettingsClick: () => void;
  onDeleteClick: () => void;
  onDragStart: (e: DragEvent) => void;
  onDragEnd: (e: DragEvent) => void;
}

export default function FormFieldItem({
  field,
  isSelected,
  isDragging,
  showConditionalIndicators,
  onSettingsClick,
  onDeleteClick,
  onDragStart,
  onDragEnd,
}: FormFieldItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isSystemField = field.isSystemField && field.deletable === false;
  const nestingLevel = field.conditionalLogic?.nestingLevel || 0;

  // Render the actual form control (disabled in builder mode)
  const renderControl = () => {
    const controlId = `builder-${field.id}`;

    switch (field.type) {
      case 'text':
        return (
          <Input
            id={controlId}
            placeholder={field.placeholder}
            defaultValue={field.defaultValue}
            required={field.required}
            maxLength={field.validation?.maxLength}
            disabled
            className="bg-muted/30"
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={controlId}
            placeholder={field.placeholder}
            defaultValue={field.defaultValue}
            required={field.required}
            maxLength={field.validation?.maxLength}
            disabled
            className="bg-muted/30 min-h-[80px]"
          />
        );

      case 'number':
        return (
          <Input
            id={controlId}
            type="number"
            placeholder={field.placeholder}
            defaultValue={field.defaultValue}
            required={field.required}
            min={field.validation?.min}
            max={field.validation?.max}
            disabled
            className="bg-muted/30"
          />
        );

      case 'date':
        return (
          <Input
            id={controlId}
            type="date"
            defaultValue={field.defaultValue}
            required={field.required}
            disabled
            className="bg-muted/30"
          />
        );

      case 'dropdown':
      case 'priority':
      case 'category':
        return (
          <Select
            id={controlId}
            defaultValue={field.defaultValue}
            required={field.required}
            disabled
            className="bg-muted/30"
          >
            <option value="">{field.placeholder || 'Select an option...'}</option>
            {field.options?.map((option, idx) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </Select>
        );

      case 'multiselect':
        return (
          <Select
            id={controlId}
            multiple
            required={field.required}
            disabled
            className="bg-muted/30 min-h-[100px]"
          >
            {field.options?.map((option, idx) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <input
              id={controlId}
              type="checkbox"
              defaultChecked={field.defaultValue}
              required={field.required}
              disabled
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor={controlId} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          </div>
        );

      case 'file':
        return (
          <Input
            id={controlId}
            type="file"
            required={field.required}
            disabled
            className="bg-muted/30"
          />
        );

      default:
        return null;
    }
  };

  // Calculate indentation based on nesting level
  const getIndentation = () => {
    if (!showConditionalIndicators || nestingLevel === 0) return '';
    return nestingLevel === 1 ? 'ml-12 pl-4' : 'ml-24 pl-4';
  };

  // Border color for conditional nesting
  const getBorderColor = () => {
    if (!showConditionalIndicators || nestingLevel === 0) return '';
    return nestingLevel === 1 ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-purple-500';
  };

  // Conditional badge
  const renderConditionalBadge = () => {
    if (!showConditionalIndicators || !field.conditionalLogic?.enabled) return null;

    // TODO: Get parent field label for display
    // const parentField = field.conditionalLogic?.parentFieldId;
    // const parentLabel = allFields.find(f => f.id === parentField)?.label;

    return (
      <Badge variant="outline" className="text-xs">
        Conditional Field
      </Badge>
    );
  };

  return (
    <div
      className={cn(
        'group relative rounded-lg border transition-all duration-200',
        isSelected && 'border-primary shadow-sm',
        isDragging && 'opacity-50',
        isHovered && 'bg-accent/30',
        getIndentation(),
        getBorderColor()
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="group"
      aria-label={`${field.label} field configuration`}
      tabIndex={0}
    >
      {/* Field Header with Controls */}
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/20 border-b border-border">
        {/* Drag Handle */}
        <button
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className="cursor-move text-muted-foreground hover:text-foreground transition-colors"
          aria-label={`Drag to reorder ${field.label}`}
          title="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Field Label */}
        <div className="flex-1 flex items-center gap-2">
          <span className="font-medium text-sm">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </span>
          {renderConditionalBadge()}
          {isSystemField && (
            <Badge variant="secondary" className="text-xs">
              System
            </Badge>
          )}
          {field.hidden && (
            <Badge variant="outline" className="text-xs">
              Hidden
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Settings Gear (always visible) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            className="h-8 w-8"
            title={
              isSystemField
                ? 'System field - only label and requirement can be edited'
                : 'Configure field'
            }
            aria-label={`Configure ${field.label}`}
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* Delete Button (visible on hover or when hovered) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onDeleteClick}
            className={cn(
              'h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10',
              !isHovered && 'opacity-0 group-hover:opacity-100',
              isSystemField && 'opacity-50 cursor-not-allowed'
            )}
            disabled={isSystemField}
            title={
              isSystemField
                ? 'System field cannot be deleted'
                : 'Delete field'
            }
            aria-label={`Delete ${field.label}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Field Content - Form Control */}
      <div className="px-4 py-4 space-y-2">
        {/* For checkbox, label is inside control */}
        {field.type !== 'checkbox' && (
          <Label htmlFor={`builder-${field.id}`} className="text-sm font-medium sr-only">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}

        {/* Actual Form Control (disabled) */}
        {renderControl()}

        {/* Help Text */}
        {field.helpText && (
          <p className="text-xs text-muted-foreground">{field.helpText}</p>
        )}
      </div>

      {/* Screen Reader Instructions */}
      <div className="sr-only">
        Press Enter to configure, Delete to remove, Shift+Arrow to reorder
      </div>
    </div>
  );
}
