import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FormField, FormFieldType } from '@/types/formBuilder';
import FormFieldRenderer from './FormFieldRenderer';
import { PlusCircle, Zap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormCanvasProps {
  fields: FormField[];
  selectedFieldId: string | null;
  onFieldsChange: (fields: FormField[]) => void;
  onFieldSelect: (fieldId: string | null) => void;
  onAddField: (fieldType: FormFieldType) => void;
}

export default function FormCanvas({
  fields,
  selectedFieldId,
  onFieldsChange,
  onFieldSelect,
  onAddField,
}: FormCanvasProps) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, field: FormField, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('fieldId', field.id);
    e.dataTransfer.setData('sourceIndex', index.toString());
    e.dataTransfer.setData('dragSource', 'canvas');
    setDraggingFieldId(field.id);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggingFieldId(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    setDraggingFieldId(null);

    const dragSource = e.dataTransfer.getData('dragSource');

    if (dragSource === 'palette') {
      // Adding new field from palette
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
                      level > 0 && "ml-8"
                    )}
                  >
                    {/* Connecting line for child fields */}
                    {level > 0 && (
                      <div className="absolute -left-8 top-0 bottom-0 w-8 flex items-center">
                        <div className="w-full h-px bg-border" />
                        <ChevronRight className="absolute right-0 h-3 w-3 text-muted-foreground" />
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
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
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
              onDragLeave={handleDragLeave}
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
