import { useState, useMemo, useRef, useEffect, type DragEvent } from 'react';
import type { FormField, FormFieldType } from '@/types/formBuilder';
import FormFieldItem from './FormFieldItem';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  const [isDraggingFromPalette, setIsDraggingFromPalette] = useState<boolean>(false);
  const [hoveredConditionalFieldId, setHoveredConditionalFieldId] = useState<string | null>(null);

  // Use ref to prevent rapid state updates during drag
  const isDraggingFromPaletteRef = useRef(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // @dnd-kit sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    };

    document.addEventListener('dragend', globalCleanup);
    document.addEventListener('drop', globalCleanup);

    return () => {
      document.removeEventListener('dragend', globalCleanup);
      document.removeEventListener('drop', globalCleanup);
    };
  }, []);

  // Handle drag end for @dnd-kit
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Validate reordering
      const oldFieldIndex = fields.findIndex((f) => f.id === active.id);
      const newFieldIndex = fields.findIndex((f) => f.id === over.id);

      if (!validateFieldReorder(active.id as string, newFieldIndex)) {
        return;
      }

      // Perform reordering on full array
      const newFields = arrayMove(fields, oldFieldIndex, newFieldIndex);

      // Update order property
      const updatedFields = newFields.map((field, idx) => ({
        ...field,
        order: idx,
      }));

      onFieldsChange(updatedFields);
    }
  };

  // Validate field reordering (prevent child from moving before parent and orphaning)
  const validateFieldReorder = (draggedFieldId: string, dropIndex: number): boolean => {
    const draggedField = fields.find((f) => f.id === draggedFieldId);
    if (!draggedField) return false;

    // If dragged field is a conditional child
    if (draggedField?.conditionalLogic?.parentFieldId) {
      const parentIndex = fields.findIndex(
        (f) => f.id === draggedField.conditionalLogic?.parentFieldId
      );

      // Prevent dropping before parent
      if (dropIndex <= parentIndex) {
        console.error('Conditional fields must appear after their parent field');
        return false;
      }
    }

    // If dragged field has children, ensure they stay after it
    const childFields = fields.filter(
      (f) => f.conditionalLogic?.parentFieldId === draggedFieldId
    );

    if (childFields.length > 0) {
      // Find the last child index
      const childIndices = childFields.map(child =>
        fields.findIndex(f => f.id === child.id)
      );
      const lastChildIndex = Math.max(...childIndices);

      // Get the current index of the dragged field
      const currentIndex = fields.findIndex(f => f.id === draggedFieldId);

      // Ensure drop index doesn't separate parent from children
      // Parent can move before or after its children, but must keep them together
      if (dropIndex > currentIndex && dropIndex <= lastChildIndex) {
        console.error('Cannot separate parent field from its children');
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
        return;
      }

      // Validate reordering
      if (!validateFieldReorder(draggedFieldId, dropIndex)) {
        setDragOverIndex(null);
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

  // Handle conditional hover start (for creating child fields)
  const handleConditionalHoverStart = (fieldId: string) => {
    // Only trigger for conditional-capable fields
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    const conditionalCapableTypes: FormFieldType[] = ['number', 'dropdown', 'checkbox', 'category', 'multiselect'];
    if (!conditionalCapableTypes.includes(field.type)) return;

    // Check nesting level
    const nestingLevel = field.conditionalLogic?.nestingLevel || 0;
    if (nestingLevel >= 2) return; // Max depth reached

    // Start hover timer (2 seconds)
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }

    hoverTimerRef.current = setTimeout(() => {
      setHoveredConditionalFieldId(fieldId);
    }, 2000); // 2 second delay as specified in UI
  };

  // Handle conditional hover end
  const handleConditionalHoverEnd = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHoveredConditionalFieldId(null);
  };

  // Handle conditional drop (creating child field)
  const handleConditionalDrop = (parentFieldId: string, fieldType: FormFieldType) => {
    const parentField = fields.find(f => f.id === parentFieldId);
    if (!parentField) return;

    // Check if parent supports conditional logic
    const conditionalCapableTypes: FormFieldType[] = ['number', 'dropdown', 'checkbox', 'category', 'multiselect'];
    if (!conditionalCapableTypes.includes(parentField.type)) {
      console.error('Parent field does not support conditional logic');
      return;
    }

    // Check nesting level
    const parentLevel = parentField.conditionalLogic?.nestingLevel || 0;
    if (parentLevel >= 2) {
      alert('Maximum nesting depth reached. Cannot add children to grandchild fields.');
      return;
    }

    // Find parent's index
    const parentIndex = fields.findIndex(f => f.id === parentFieldId);
    if (parentIndex === -1) return;

    // Create new child field
    const newField: FormField = {
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: fieldType,
      label: `${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} Field`,
      placeholder: fieldType === 'text' ? 'Enter text...' : fieldType === 'textarea' ? 'Enter detailed text...' : undefined,
      required: false,
      order: parentIndex + 1,
      conditionalLogic: {
        enabled: true,
        parentFieldId: parentFieldId,
        conditions: [],
        childFields: [],
        nestingLevel: parentLevel + 1,
      },
    };

    // Enable conditional logic on parent if not already enabled
    const updatedParent = {
      ...parentField,
      conditionalLogic: {
        ...parentField.conditionalLogic,
        enabled: true,
        childFields: [...(parentField.conditionalLogic?.childFields || []), newField.id],
        conditions: parentField.conditionalLogic?.conditions || [],
        nestingLevel: parentLevel,
      },
    };

    // Insert child field immediately after parent
    const updatedFields = [
      ...fields.slice(0, parentIndex),
      updatedParent,
      newField,
      ...fields.slice(parentIndex + 1),
    ];

    // Recalculate order properties
    const finalFields = updatedFields.map((field, idx) => ({
      ...field,
      order: idx,
    }));

    onFieldsChange(finalFields);
    onFieldSelect(newField.id);
    onFieldSettingsClick(newField.id);

    // Clear hover state
    setHoveredConditionalFieldId(null);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  // Filter hidden fields (they don't appear in live preview)
  const visibleFields = useMemo(() => {
    return fields.filter((field) => !field.hidden);
  }, [fields]);

  // Sortable wrapper component for individual fields
  interface SortableFormFieldItemProps {
    field: FormField;
    isSelected: boolean;
    showConditionalIndicators: boolean;
    isDraggingFromPalette: boolean;
    hoveredConditionalFieldId: string | null;
    onSettingsClick: () => void;
    onDeleteClick: () => void;
    onConditionalHoverStart: (fieldId: string) => void;
    onConditionalHoverEnd: () => void;
    onConditionalDrop: (parentFieldId: string, fieldType: FormFieldType) => void;
  }

  function SortableFormFieldItem({
    field,
    isSelected,
    showConditionalIndicators,
    isDraggingFromPalette,
    hoveredConditionalFieldId,
    onSettingsClick,
    onDeleteClick,
    onConditionalHoverStart,
    onConditionalHoverEnd,
    onConditionalDrop,
  }: SortableFormFieldItemProps) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: field.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        onDragOver={isDraggingFromPalette ? (e) => {
          e.preventDefault();
          onConditionalHoverStart(field.id);
        } : undefined}
        onDragLeave={isDraggingFromPalette ? onConditionalHoverEnd : undefined}
        onDrop={isDraggingFromPalette && hoveredConditionalFieldId === field.id ? (e) => {
          e.preventDefault();
          e.stopPropagation();
          const fieldType = e.dataTransfer.getData('fieldType') as FormFieldType;
          onConditionalDrop(field.id, fieldType);
        } : undefined}
      >
        <FormFieldItem
          field={field}
          isSelected={isSelected}
          isDragging={isDragging}
          showConditionalIndicators={showConditionalIndicators}
          showConditionalDropZone={isDraggingFromPalette && hoveredConditionalFieldId === field.id}
          onSettingsClick={onSettingsClick}
          onDeleteClick={onDeleteClick}
          dragHandleProps={{ ...attributes, ...listeners }}
        />
      </div>
    );
  }

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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="max-w-2xl mx-auto py-6 space-y-1">
        {/* Drop zone before first field (for palette items only) */}
        {isDraggingFromPalette && (
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

        <SortableContext
          items={visibleFields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          {/* Render each field */}
          {visibleFields.map((field, index) => (
            <div key={field.id} className="relative">
              {/* Sortable Field Item */}
              <SortableFormFieldItem
                field={field}
                isSelected={selectedFieldId === field.id}
                showConditionalIndicators={showConditionalIndicators}
                isDraggingFromPalette={isDraggingFromPalette}
                hoveredConditionalFieldId={hoveredConditionalFieldId}
                onSettingsClick={() => onFieldSettingsClick(field.id)}
                onDeleteClick={() => onFieldDelete(field.id)}
                onConditionalHoverStart={handleConditionalHoverStart}
                onConditionalHoverEnd={handleConditionalHoverEnd}
                onConditionalDrop={handleConditionalDrop}
              />

              {/* Drop zone after this field (for palette items only) */}
              {isDraggingFromPalette && (
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
        </SortableContext>
      </div>
    </DndContext>
  );
}
