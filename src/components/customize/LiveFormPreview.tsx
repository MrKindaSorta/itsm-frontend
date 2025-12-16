import { useState, useMemo, useRef, useEffect, type DragEvent } from 'react';
import type { FormField, FormFieldType } from '@/types/formBuilder';
import FormFieldItem from './FormFieldItem';
import { cn } from '@/lib/utils';

interface LiveFormPreviewProps {
  fields: FormField[];
  selectedFieldId: string | null;
  showConditionalIndicators: boolean;
  onFieldsChange: (fields: FormField[]) => void;
  onFieldSelect: (fieldId: string | null) => void;
  onAddField: (fieldType: FormFieldType, insertAtIndex?: number) => void;
  onFieldSettingsClick: (fieldId: string) => void;
  onFieldDelete: (fieldId: string) => void;
}

export default function LiveFormPreview({
  fields,
  selectedFieldId,
  showConditionalIndicators,
  onFieldsChange,
  onFieldSelect,
  onAddField,
  onFieldSettingsClick,
  onFieldDelete,
}: LiveFormPreviewProps) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);
  const [isDraggingFromPalette, setIsDraggingFromPalette] = useState<boolean>(false);

  // Use ref to prevent rapid state updates during drag
  const isDraggingFromPaletteRef = useRef(false);

  // Listen for palette drag events
  useEffect(() => {
    const handlePaletteDragStart = () => {
      isDraggingFromPaletteRef.current = true;
      setIsDraggingFromPalette(true);
    };

    const handlePaletteDragEnd = () => {
      isDraggingFromPaletteRef.current = false;
      setIsDraggingFromPalette(false);
      setDragOverIndex(null);
    };

    window.addEventListener('palette-drag-start', handlePaletteDragStart);
    window.addEventListener('palette-drag-end', handlePaletteDragEnd);

    return () => {
      window.removeEventListener('palette-drag-start', handlePaletteDragStart);
      window.removeEventListener('palette-drag-end', handlePaletteDragEnd);
    };
  }, []);

  // Global failsafe: cleanup on ANY dragend event
  useEffect(() => {
    const globalCleanup = () => {
      isDraggingFromPaletteRef.current = false;
      setIsDraggingFromPalette(false);
      setDragOverIndex(null);
      setDraggingFieldId(null);
    };

    document.addEventListener('dragend', globalCleanup);
    document.addEventListener('drop', globalCleanup);

    return () => {
      document.removeEventListener('dragend', globalCleanup);
      document.removeEventListener('drop', globalCleanup);
    };
  }, []);

  // Handle drag start from field (within preview)
  const handleFieldDragStart = (field: FormField, index: number) => (e: DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('fieldId', field.id);
    e.dataTransfer.setData('sourceIndex', index.toString());
    e.dataTransfer.setData('dragSource', 'canvas');
    setDraggingFieldId(field.id);
    onFieldSelect(field.id);
  };

  // Handle drag end
  const handleFieldDragEnd = () => {
    setDraggingFieldId(null);
  };

  // Validate field reordering (prevent child from moving before parent)
  const validateFieldReorder = (draggedFieldId: string, dropIndex: number): boolean => {
    const draggedField = fields.find((f) => f.id === draggedFieldId);

    // If dragged field is a conditional child
    if (draggedField?.conditionalLogic?.parentFieldId) {
      const parentIndex = fields.findIndex(
        (f) => f.id === draggedField.conditionalLogic?.parentFieldId
      );

      // Prevent dropping before parent
      if (dropIndex <= parentIndex) {
        // TODO: Show toast error
        console.error('Conditional fields must appear after their parent field');
        return false;
      }
    }

    return true;
  };

  // Handle drop on drop zone
  const handleDrop = (dropIndex: number) => (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const dragSource = e.dataTransfer.getData('dragSource');

    if (dragSource === 'palette') {
      // Adding new field from palette at specific position
      const fieldType = e.dataTransfer.getData('fieldType') as FormFieldType;
      onAddField(fieldType, dropIndex);
    } else if (dragSource === 'canvas') {
      // Reordering existing field
      const draggedFieldId = e.dataTransfer.getData('fieldId');
      const sourceIndex = fields.findIndex((f) => f.id === draggedFieldId);

      if (sourceIndex === -1 || sourceIndex === dropIndex) {
        setDragOverIndex(null);
        setDraggingFieldId(null);
        return;
      }

      // Validate reordering
      if (!validateFieldReorder(draggedFieldId, dropIndex)) {
        setDragOverIndex(null);
        setDraggingFieldId(null);
        return;
      }

      // Perform reordering
      const newFields = [...fields];
      const [movedField] = newFields.splice(sourceIndex, 1);
      newFields.splice(dropIndex, 0, movedField);

      // Update order property
      const updatedFields = newFields.map((field, idx) => ({
        ...field,
        order: idx,
      }));

      onFieldsChange(updatedFields);
    }

    setDragOverIndex(null);
    setDraggingFieldId(null);
  };

  // Handle drag over drop zone
  const handleDragOver = (index: number) => (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverIndex(index);
  };

  // Handle drag leave drop zone
  const handleDragLeave = () => {
    // Note: setDragOverIndex will be updated on next dragover
  };

  // Filter hidden fields (they don't appear in live preview)
  const visibleFields = useMemo(() => {
    return fields.filter((field) => !field.hidden);
  }, [fields]);

  // Empty state
  if (visibleFields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
        <p className="text-sm text-muted-foreground">
          No fields to display
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Drag field types from the left to add them to your form
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-1">
      {/* Drop zone before first field */}
      {(isDraggingFromPalette || draggingFieldId) && (
        <div
          className={cn(
            'relative h-12 rounded-lg border-2 border-dashed transition-colors',
            dragOverIndex === 0
              ? 'border-primary bg-primary/10'
              : 'border-transparent hover:border-primary/50'
          )}
          onDragOver={handleDragOver(0)}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop(0)}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Drop here</span>
          </div>
        </div>
      )}

      {/* Render each field */}
      {visibleFields.map((field, index) => (
        <div key={field.id} className="relative">
          {/* Field Item */}
          <FormFieldItem
            field={field}
            isSelected={selectedFieldId === field.id}
            isDragging={draggingFieldId === field.id}
            showConditionalIndicators={showConditionalIndicators}
            onSettingsClick={() => onFieldSettingsClick(field.id)}
            onDeleteClick={() => onFieldDelete(field.id)}
            onDragStart={handleFieldDragStart(field, index)}
            onDragEnd={handleFieldDragEnd}
          />

          {/* Drop zone after this field */}
          {(isDraggingFromPalette || draggingFieldId) && (
            <div
              className={cn(
                'relative h-12 rounded-lg border-2 border-dashed transition-colors mt-1',
                dragOverIndex === index + 1
                  ? 'border-primary bg-primary/10'
                  : 'border-transparent hover:border-primary/50'
              )}
              onDragOver={handleDragOver(index + 1)}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop(index + 1)}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Drop here</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
