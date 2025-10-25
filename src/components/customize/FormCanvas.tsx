import { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FormField, FormFieldType, ConditionRule } from '@/types/formBuilder';
import FormFieldRenderer from './FormFieldRenderer';
import { PlusCircle, Zap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FIELD_TYPES } from './FieldPalette';

interface FormCanvasProps {
  fields: FormField[];
  selectedFieldId: string | null;
  onFieldsChange: (fields: FormField[]) => void;
  onFieldSelect: (fieldId: string | null) => void;
  onAddField: (fieldType: FormFieldType, insertAtIndex?: number) => void;
  onCreateChildField?: (childField: Partial<FormField>, parentFieldId: string) => void;
}

export default function FormCanvas({
  fields,
  selectedFieldId,
  onFieldsChange,
  onFieldSelect,
  onAddField,
  onCreateChildField,
}: FormCanvasProps) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);

  // Track when dragging from palette to show drop targets
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

  // Global failsafe: cleanup on ANY dragend event (catches edge cases)
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

  const handleDragStart = (e: React.DragEvent, field: FormField, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('fieldId', field.id);
    e.dataTransfer.setData('sourceIndex', index.toString());
    e.dataTransfer.setData('dragSource', 'canvas');
    setDraggingFieldId(field.id);
  };

  const handleDragEnd = () => {
    setDraggingFieldId(null);
    // Note: isDraggingFromPalette cleanup is handled by event listeners and global failsafe
  };

  const handleConditionalDragEnter = () => {
    // Clear drop zone highlights when entering conditional drop zone
    setDragOverIndex(null);
  };

  // Helper function to create default condition based on field type
  const createDefaultCondition = (parentField: FormField): ConditionRule => {
    switch (parentField.type) {
      case 'number':
        return {
          type: 'equals',
          operator: 'equals',
          value: 0,
        };
      case 'dropdown':
      case 'category':
      case 'multiselect':
        const firstOption = parentField.options?.[0] || 'Option 1';
        return {
          type: 'optionMatch',
          options: [firstOption],
        };
      case 'checkbox':
        return {
          type: 'checkboxState',
          value: true,
        };
      default:
        return {
          type: 'equals',
          operator: 'equals',
          value: undefined,
        };
    }
  };

  // Separate handler for child target drops
  const handleChildTargetDrop = (e: React.DragEvent, parentField: FormField) => {
    e.stopPropagation();
    e.preventDefault();

    if (!onCreateChildField) {
      return;
    }

    const fieldType = e.dataTransfer.getData('fieldType') as FormFieldType;
    const fieldTemplate = FIELD_TYPES.find((ft) => ft.type === fieldType);

    if (fieldTemplate) {
      const childNestingLevel = (parentField.conditionalLogic?.nestingLevel || 0) + 1;

      // Create child field with default condition
      const childField: Partial<FormField> = {
        id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: fieldType,
        label: fieldTemplate.defaultConfig.label || 'New Field',
        placeholder: fieldTemplate.defaultConfig.placeholder,
        required: fieldTemplate.defaultConfig.required || false,
        options: fieldTemplate.defaultConfig.options,
        defaultValue: fieldTemplate.defaultConfig.defaultValue,
        order: fields.length,
        deletable: true,
        conditionalLogic: {
          enabled: true,
          parentFieldId: parentField.id,
          conditions: [createDefaultCondition(parentField)],
          childFields: [],
          nestingLevel: childNestingLevel,
        },
      };

      // Let parent component handle all state updates atomically
      onCreateChildField(childField, parentField.id);
    }

    isDraggingFromPaletteRef.current = false;
    setIsDraggingFromPalette(false);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    console.log('[handleDrop] Drop event fired', { dropIndex });
    e.preventDefault();
    setDragOverIndex(null);
    setIsDraggingFromPalette(false);
    setDraggingFieldId(null);

    const dragSource = e.dataTransfer.getData('dragSource');
    console.log('[handleDrop] Drag source:', dragSource);

    if (dragSource === 'palette') {
      // Adding new field from palette at specific position
      const fieldType = e.dataTransfer.getData('fieldType') as FormFieldType;
      console.log('[handleDrop] Adding from palette:', fieldType, 'at index:', dropIndex);
      onAddField(fieldType, dropIndex);
    } else if (dragSource === 'canvas') {
      // Reordering existing field - use field ID to find actual position
      const draggedFieldId = e.dataTransfer.getData('fieldId');
      const sourceIndex = fields.findIndex(f => f.id === draggedFieldId);

      console.log('[handleDrop] Reordering within canvas:', {
        draggedFieldId,
        sourceIndex,
        dropIndex,
        fieldsLength: fields.length
      });

      if (sourceIndex === -1) {
        console.error('[handleDrop] Source field not found!', draggedFieldId);
        return;
      }

      if (sourceIndex === dropIndex) {
        console.log('[handleDrop] Source and drop are same, skipping');
        return;
      }

      const newFields = [...fields];
      const [movedField] = newFields.splice(sourceIndex, 1);
      newFields.splice(dropIndex, 0, movedField);

      // Update order property
      const updatedFields = newFields.map((field, idx) => ({
        ...field,
        order: idx,
      }));

      console.log('[handleDrop] Calling onFieldsChange with reordered fields');
      onFieldsChange(updatedFields);
    } else {
      console.warn('[handleDrop] Unknown drag source:', dragSource);
    }
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    // Note: isDraggingFromPalette is now managed by event listeners
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dragSource = e.dataTransfer.getData('dragSource');

    if (dragSource === 'palette') {
      // Add field at the end
      const fieldType = e.dataTransfer.getData('fieldType') as FormFieldType;
      onAddField(fieldType);
    }
  };

  const handleDeleteField = (fieldId: string) => {
    // Check if the field is deletable
    const field = fields.find((f) => f.id === fieldId);
    if (field && field.deletable === false) {
      // System fields cannot be deleted
      return;
    }

    const newFields = fields
      .filter((f) => f.id !== fieldId)
      .map((field, idx) => ({ ...field, order: idx }));
    onFieldsChange(newFields);
    if (selectedFieldId === fieldId) {
      onFieldSelect(null);
    }
  };

  const handleToggleHidden = (fieldId: string) => {
    const updatedFields = fields.map((f) =>
      f.id === fieldId ? { ...f, hidden: !f.hidden } : f
    );
    onFieldsChange(updatedFields);
  };

  // Organize fields into hierarchy (root fields with their children)
  const fieldHierarchy = useMemo(() => {
    const rootFields = fields.filter(f => !f.conditionalLogic?.parentFieldId);
    const childFieldsMap = new Map<string, FormField[]>();

    // Group children by parent
    fields.forEach(field => {
      const parentId = field.conditionalLogic?.parentFieldId;
      if (parentId) {
        if (!childFieldsMap.has(parentId)) {
          childFieldsMap.set(parentId, []);
        }
        childFieldsMap.get(parentId)!.push(field);
      }
    });

    // Build hierarchy with children nested under parents
    const buildHierarchy = (field: FormField, level: number = 0): any => {
      const children = childFieldsMap.get(field.id) || [];
      return {
        field,
        level,
        children: children.map(child => buildHierarchy(child, level + 1))
      };
    };

    return rootFields.map(field => buildHierarchy(field));
  }, [fields]);

  // Flatten hierarchy for rendering while preserving structure info
  const flattenedFields = useMemo(() => {
    const result: Array<{ field: FormField; level: number; hasChildren: boolean }> = [];

    const flatten = (node: any) => {
      result.push({
        field: node.field,
        level: node.level,
        hasChildren: node.children.length > 0
      });
      node.children.forEach((child: any) => flatten(child));
    };

    fieldHierarchy.forEach(node => flatten(node));

    return result;
  }, [fieldHierarchy]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Form Canvas</CardTitle>
        <p className="text-sm text-muted-foreground">
          {fields.length === 0
            ? 'Drag fields from the palette to start building your form'
            : `${fields.length} field${fields.length !== 1 ? 's' : ''} in form`}
        </p>
      </CardHeader>
      <CardContent
        className="flex-1 overflow-auto"
        onDragOver={handleCanvasDragOver}
        onDrop={handleCanvasDrop}
        onDragEnd={handleDragEnd}
      >
        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed border-border rounded-lg">
            <PlusCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Drag and drop field types here to build your form
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {flattenedFields.map(({ field, level, hasChildren }, index) => {
              const isConditional = field.conditionalLogic?.enabled || false;
              const nestingLevel = field.conditionalLogic?.nestingLevel || 0;
              const isConditionalCapable = ['number', 'dropdown', 'checkbox', 'category', 'multiselect'].includes(field.type);
              const canHaveChildren = (field.conditionalLogic?.nestingLevel || 0) < 2;
              const showConditionalDropZone = isDraggingFromPalette && isConditionalCapable && canHaveChildren;

              return (
                <div key={`${field.id}-${isDraggingFromPalette}`}>
                  {/* Drop Zone Before Field */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverIndex(index);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Map flattened index to actual fields array index
                      const targetField = flattenedFields[index]?.field;
                      const actualDropIndex = targetField ? fields.findIndex(f => f.id === targetField.id) : index;
                      handleDrop(e, actualDropIndex);
                    }}
                    className={cn(
                      "h-8 transition-all duration-150",
                      (isDraggingFromPalette || draggingFieldId) && "hover:bg-primary/10 rounded",
                      dragOverIndex === index && "bg-primary/20 border-2 border-primary border-dashed rounded h-12"
                    )}
                  />

                  {/* Visual nesting indicators */}
                  <div
                    className={cn(
                      "relative rounded-lg",
                      level > 0 && "ml-12 pl-4 bg-muted/30 border-l-4 border-primary/40",
                      level === 1 && "border-l-blue-500/50",
                      level === 2 && "border-l-purple-500/50"
                    )}
                  >
                    {/* Connecting line for child fields */}
                    {level > 0 && (
                      <div className="absolute -left-12 top-0 bottom-0 w-12 flex items-center">
                        <div className="w-full h-0.5 bg-primary/30" />
                        <ChevronRight className={cn(
                          "absolute right-0 h-4 w-4",
                          level === 1 && "text-blue-500",
                          level === 2 && "text-purple-500",
                          level === 0 && "text-muted-foreground"
                        )} />
                      </div>
                    )}

                    {/* Field badges */}
                    <div className="flex items-center gap-2 mb-1">
                      {isConditional && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Zap className="h-3 w-3" />
                          Conditional
                        </Badge>
                      )}
                      {nestingLevel > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Level {nestingLevel}
                        </Badge>
                      )}
                      {hasChildren && (
                        <Badge variant="default" className="text-xs">
                          Has {flattenedFields.filter(f => f.field.conditionalLogic?.parentFieldId === field.id).length} child fields
                        </Badge>
                      )}
                    </div>

                    <FormFieldRenderer
                      field={field}
                      index={index}
                      isSelected={selectedFieldId === field.id}
                      isDragging={draggingFieldId === field.id}
                      showConditionalDropZone={showConditionalDropZone}
                      onSelect={() => onFieldSelect(field.id)}
                      onDelete={() => handleDeleteField(field.id)}
                      onToggleHidden={() => handleToggleHidden(field.id)}
                      onDragStart={(e) => handleDragStart(e, field, index)}
                      onDragOver={() => {}}
                      onDragLeave={() => {}}
                      onDragEnd={handleDragEnd}
                      onDrop={() => {}}
                      onConditionalDrop={(e) => handleChildTargetDrop(e, field)}
                      onConditionalDragEnter={handleConditionalDragEnter}
                    />
                  </div>
                </div>
              );
            })}
            {/* Drop Zone After Last Field */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverIndex(fields.length);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDrop(e, fields.length);
              }}
              className={cn(
                "h-12 transition-all duration-150 border-2 border-dashed rounded flex items-center justify-center",
                (isDraggingFromPalette || draggingFieldId) ? "border-muted-foreground/30" : "border-transparent",
                dragOverIndex === fields.length && "bg-primary/20 border-primary h-16"
              )}
            >
              {dragOverIndex === fields.length && (
                <p className="text-xs font-medium text-primary">Drop here</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
