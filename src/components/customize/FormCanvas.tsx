import { useState, useMemo, useEffect } from 'react';
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
  onAddField: (fieldType: FormFieldType) => void;
  onCreateChildField?: (childField: Partial<FormField>) => void;
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

  // Hover timer state for child field creation
  const [hoveredParentId, setHoveredParentId] = useState<string | null>(null);
  const [hoverStartTime, setHoverStartTime] = useState<number | null>(null);
  const [hoverProgress, setHoverProgress] = useState<number>(0);

  // Update progress every 100ms when hovering
  useEffect(() => {
    if (!hoverStartTime || !hoveredParentId) {
      setHoverProgress(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - hoverStartTime;
      const progress = Math.min((elapsed / 2000) * 100, 100);
      setHoverProgress(progress);
    }, 100);

    return () => clearInterval(interval);
  }, [hoverStartTime, hoveredParentId]);

  const handleDragStart = (e: React.DragEvent, field: FormField, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('fieldId', field.id);
    e.dataTransfer.setData('sourceIndex', index.toString());
    e.dataTransfer.setData('dragSource', 'canvas');
    setDraggingFieldId(field.id);
  };

  const handleDragOver = (e: React.DragEvent, targetField: FormField, index: number) => {
    e.preventDefault();

    const dragSource = e.dataTransfer.types.includes('text/plain') ? 'palette' : 'canvas';

    // Check if dragging from palette over a conditional field
    if (dragSource === 'palette') {
      const isConditionalField = targetField.conditionalLogic?.enabled === true;
      const nestingLevel = targetField.conditionalLogic?.nestingLevel || 0;
      const canAddChild = nestingLevel < 2; // Max 3 levels (0, 1, 2)

      if (isConditionalField && canAddChild) {
        // Valid parent field for child creation
        if (hoveredParentId !== targetField.id) {
          // Start new hover
          setHoveredParentId(targetField.id);
          setHoverStartTime(Date.now());
        }
        // Don't set dragOverIndex for normal drop zone
        return;
      }
    }

    // Normal drag-over behavior for reordering
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);

    // Reset hover state if not over valid parent
    if (hoveredParentId) {
      setHoveredParentId(null);
      setHoverStartTime(null);
      setHoverProgress(0);
    }
  };

  const handleDragLeave = (_e: React.DragEvent, fieldId?: string) => {
    setDragOverIndex(null);

    // Reset hover timer if leaving the hovered parent
    if (fieldId && hoveredParentId === fieldId) {
      setHoveredParentId(null);
      setHoverStartTime(null);
      setHoverProgress(0);
    }
  };

  const handleDragEnd = () => {
    setDraggingFieldId(null);
    setDragOverIndex(null);
    setHoveredParentId(null);
    setHoverStartTime(null);
    setHoverProgress(0);
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

  const handleDrop = (e: React.DragEvent, dropIndex: number, targetField?: FormField) => {
    e.preventDefault();
    setDragOverIndex(null);

    const dragSource = e.dataTransfer.getData('dragSource');

    // Check if this is a child creation drop (hover exceeded 2 seconds)
    if (dragSource === 'palette' && hoveredParentId && hoverProgress >= 100 && targetField && onCreateChildField) {
      const fieldType = e.dataTransfer.getData('fieldType') as FormFieldType;
      const fieldTemplate = FIELD_TYPES.find((ft) => ft.type === fieldType);

      if (fieldTemplate && hoveredParentId === targetField.id) {
        const parentField = fields.find(f => f.id === hoveredParentId);
        if (parentField) {
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

          onCreateChildField(childField);
        }

        // Reset hover state
        setHoveredParentId(null);
        setHoverStartTime(null);
        setHoverProgress(0);
        return;
      }
    }

    // Reset hover state for normal drops
    setHoveredParentId(null);
    setHoverStartTime(null);
    setHoverProgress(0);
    setDraggingFieldId(null);

    if (dragSource === 'palette') {
      // Adding new field from palette (normal drop)
      const fieldType = e.dataTransfer.getData('fieldType') as FormFieldType;
      onAddField(fieldType);
    } else if (dragSource === 'canvas') {
      // Reordering existing field
      const sourceIndex = parseInt(e.dataTransfer.getData('sourceIndex'));
      if (sourceIndex === dropIndex) return;

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
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
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
      >
        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed border-border rounded-lg">
            <PlusCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Drop field types here or click on a field in the palette to add it to your form
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {flattenedFields.map(({ field, level, hasChildren }, index) => {
              const isConditional = field.conditionalLogic?.enabled || false;
              const nestingLevel = field.conditionalLogic?.nestingLevel || 0;

              return (
                <div key={field.id} className="relative">
                  {dragOverIndex === index && draggingFieldId !== field.id && (
                    <div className="absolute -top-1.5 left-0 right-0 h-1 bg-primary rounded-full z-10" />
                  )}

                  {/* Visual nesting indicators */}
                  <div
                    className={cn(
                      "relative",
                      level > 0 && "ml-8",
                      hoveredParentId === field.id && "transition-all duration-200"
                    )}
                  >
                    {/* Connecting line for child fields */}
                    {level > 0 && (
                      <div className="absolute -left-8 top-0 bottom-0 w-8 flex items-center">
                        <div className="w-full h-px bg-border" />
                        <ChevronRight className="absolute right-0 h-3 w-3 text-muted-foreground" />
                      </div>
                    )}

                    {/* Hover Tooltip for Child Creation */}
                    {hoveredParentId === field.id && hoverProgress > 0 && (
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
                        <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg text-xs font-medium whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>
                              {hoverProgress < 100
                                ? `Hold to create child field... (${((2000 - (Date.now() - (hoverStartTime || 0))) / 1000).toFixed(1)}s)`
                                : 'Release to create child field!'}
                            </span>
                          </div>
                          <div className="w-full h-1 bg-primary-foreground/30 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-primary-foreground transition-all duration-100"
                              style={{ width: `${hoverProgress}%` }}
                            />
                          </div>
                        </div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-primary" />
                        </div>
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

                    {/* Parent field highlight during hover */}
                    <div
                      className={cn(
                        hoveredParentId === field.id && "ring-2 ring-primary ring-offset-2 rounded-lg animate-pulse"
                      )}
                    >
                      <FormFieldRenderer
                        field={field}
                        index={index}
                        isSelected={selectedFieldId === field.id}
                        isDragging={draggingFieldId === field.id}
                        onSelect={() => onFieldSelect(field.id)}
                        onDelete={() => handleDeleteField(field.id)}
                        onToggleHidden={() => handleToggleHidden(field.id)}
                        onDragStart={(e) => handleDragStart(e, field, index)}
                        onDragOver={(e) => handleDragOver(e, field, index)}
                        onDragLeave={(e) => handleDragLeave(e, field.id)}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, index, field)}
                      />
                    </div>
                  </div>

                  {dragOverIndex === index + 1 && (
                    <div className="absolute -bottom-1.5 left-0 right-0 h-1 bg-primary rounded-full z-10" />
                  )}
                </div>
              );
            })}
            {/* Drop zone at the end */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverIndex(fields.length);
              }}
              onDragLeave={(e) => handleDragLeave(e)}
              onDrop={(e) => handleDrop(e, fields.length)}
              className={cn(
                'h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center transition-colors',
                dragOverIndex === fields.length && 'border-primary bg-primary/5'
              )}
            >
              <p className="text-xs text-muted-foreground">Drop here to add at the end</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
