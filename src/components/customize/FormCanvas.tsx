import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FormField, FormFieldType, ConditionRule } from '@/types/formBuilder';
import FormFieldRenderer from './FormFieldRenderer';
import { PlusCircle, Zap, ChevronRight, ArrowDown } from 'lucide-react';
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
  const [dragOverChildTarget, setDragOverChildTarget] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, field: FormField, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('fieldId', field.id);
    e.dataTransfer.setData('sourceIndex', index.toString());
    e.dataTransfer.setData('dragSource', 'canvas');
    setDraggingFieldId(field.id);
  };

  const handleDragOver = (e: React.DragEvent, _targetField: FormField, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);

    // Detect palette drag by checking effectAllowed (palette='copy', canvas='move')
    // Only update state if it's actually changing to prevent redundant re-renders
    if (e.dataTransfer.effectAllowed === 'copy' && !draggingFieldId && !isDraggingFromPalette) {
      setIsDraggingFromPalette(true);
    }
  };

  const handleDragLeave = (_e: React.DragEvent, fieldId?: string) => {
    setDragOverIndex(null);
    if (fieldId && dragOverChildTarget === fieldId) {
      setDragOverChildTarget(null);
    }
  };

  const handleDragEnd = () => {
    setDraggingFieldId(null);
    setDragOverIndex(null);
    setIsDraggingFromPalette(false);
    setDragOverChildTarget(null);
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

    if (!onCreateChildField) return;

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

      console.log('[FormCanvas] Creating child field:', {
        parentId: parentField.id,
        parentLabel: parentField.label,
        childId: childField.id,
        childLabel: childField.label,
        childType: childField.type,
        nestingLevel: childNestingLevel
      });

      // Let parent component handle all state updates atomically
      onCreateChildField(childField, parentField.id);
    }

    setIsDraggingFromPalette(false);
    setDragOverChildTarget(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    setDragOverChildTarget(null);
    setIsDraggingFromPalette(false);
    setDraggingFieldId(null);

    const dragSource = e.dataTransfer.getData('dragSource');

    if (dragSource === 'palette') {
      // Adding new field from palette at specific position
      const fieldType = e.dataTransfer.getData('fieldType') as FormFieldType;
      onAddField(fieldType, dropIndex);
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

    // Detect if dragging from palette using effectAllowed
    // Only update state if it's actually changing to prevent redundant re-renders
    if (e.dataTransfer.effectAllowed === 'copy' && !isDraggingFromPalette) {
      setIsDraggingFromPalette(true);
    }
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
        onDragLeave={handleDragEnd}
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
          <div className="space-y-3">
            {flattenedFields.map(({ field, level, hasChildren }, index) => {
              const isConditional = field.conditionalLogic?.enabled || false;
              const nestingLevel = field.conditionalLogic?.nestingLevel || 0;
              const isConditionalCapable = ['number', 'dropdown', 'checkbox', 'category', 'multiselect'].includes(field.type);
              const canHaveChildren = (field.conditionalLogic?.nestingLevel || 0) < 2;
              const shouldShowCircle = isDraggingFromPalette && isConditionalCapable && canHaveChildren;

              return (
                <div key={field.id} className="relative">
                  {dragOverIndex === index && draggingFieldId !== field.id && (
                    <div className="absolute -top-1.5 left-0 right-0 h-1 bg-primary rounded-full z-10" />
                  )}

                  {/* Visual nesting indicators */}
                  <div
                    className={cn(
                      "relative rounded-lg transition-all duration-200",
                      level > 0 && "ml-12 pl-4 bg-muted/30 border-l-4 border-primary/40",
                      level === 1 && "border-l-blue-500/50",
                      level === 2 && "border-l-purple-500/50",
                      // Add visual gap when dragging over this field
                      dragOverIndex === index && "mt-16",
                      dragOverIndex === index + 1 && "mb-16"
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

                    {/* Child Drop Target Circle (Purple) */}
                    {shouldShowCircle && (
                      <div
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
                        onDragOver={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setDragOverChildTarget(field.id);
                        }}
                        onDragLeave={(e) => {
                          e.stopPropagation();
                          setDragOverChildTarget(null);
                        }}
                        onDrop={(e) => handleChildTargetDrop(e, field)}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-all cursor-pointer",
                          dragOverChildTarget === field.id
                            ? "bg-purple-600 scale-110 animate-pulse"
                            : "bg-purple-500 hover:bg-purple-600"
                        )}>
                          <ArrowDown className="h-5 w-5 text-white" />
                        </div>
                        {dragOverChildTarget === field.id && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">
                            Drop to add as child
                          </div>
                        )}
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
                      onSelect={() => onFieldSelect(field.id)}
                      onDelete={() => handleDeleteField(field.id)}
                      onToggleHidden={() => handleToggleHidden(field.id)}
                      onDragStart={(e) => handleDragStart(e, field, index)}
                      onDragOver={(e) => handleDragOver(e, field, index)}
                      onDragLeave={(e) => handleDragLeave(e, field.id)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index)}
                    />
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
                'h-16 border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-200',
                isDraggingFromPalette
                  ? 'border-blue-500 bg-blue-50 shadow-lg animate-pulse'
                  : 'border-border',
                dragOverIndex === fields.length && 'border-blue-600 bg-blue-100'
              )}
            >
              <p className={cn(
                "text-xs font-medium",
                isDraggingFromPalette ? "text-blue-600" : "text-muted-foreground"
              )}>
                Drop here to add field
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
