import { useState } from 'react';
import FieldListItem from './FieldListItem';
import type { FormField } from '@/types/formBuilder';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FieldListProps {
  fields: FormField[];
  selectedFieldId: string | null;
  showConditionalIndicators: boolean;
  isChildSelectionMode?: boolean;
  onFieldSelect: (fieldId: string) => void;
  onFieldMove: (fieldId: string, direction: 'up' | 'down') => void;
  onFieldDelete: (fieldId: string) => void;
  onFieldEdit: (fieldId: string) => void;
  onAddChildField: (parentFieldId: string) => void;
  onCancelChildSelection?: () => void;
}

export default function FieldList({
  fields,
  selectedFieldId,
  showConditionalIndicators,
  isChildSelectionMode = false,
  onFieldSelect,
  onFieldMove,
  onFieldDelete,
  onFieldEdit,
  onAddChildField,
  onCancelChildSelection,
}: FieldListProps) {
  const [hoveredFieldId, setHoveredFieldId] = useState<string | null>(null);

  // Filter visible fields (hidden fields don't appear in the list)
  const visibleFields = fields.filter((f) => !f.hidden);

  // Empty state
  if (visibleFields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-6">
        <p className="text-muted-foreground mb-2">No fields in your form yet</p>
        <p className="text-sm text-muted-foreground">
          Add your first field using the button below
        </p>
      </div>
    );
  }

  // Calculate if field can move up/down based on parent-child relationships
  const canMoveUp = (index: number, field: FormField) => {
    if (index === 0) return false;

    // If field is a child, cannot move before parent
    if (field.conditionalLogic?.parentFieldId) {
      const parentIndex = visibleFields.findIndex(
        (f) => f.id === field.conditionalLogic?.parentFieldId
      );
      // Can only move up if new position is still after parent
      return index - 1 > parentIndex;
    }

    return true;
  };

  const canMoveDown = (index: number, field: FormField) => {
    if (index === visibleFields.length - 1) return false;

    // If field has children, cannot move past last child
    const childFields = visibleFields.filter(
      (f) => f.conditionalLogic?.parentFieldId === field.id
    );

    if (childFields.length > 0) {
      const childIndices = childFields.map((c) =>
        visibleFields.findIndex((f) => f.id === c.id)
      );
      const lastChildIndex = Math.max(...childIndices);
      // Can only move down if not separating from children
      return index + 1 < lastChildIndex || index >= lastChildIndex;
    }

    return true;
  };

  // Check if field supports conditional logic (can have children)
  const supportsConditionalLogic = (fieldType: string) => {
    return ['number', 'dropdown', 'checkbox', 'category', 'multiselect'].includes(fieldType);
  };

  // Check if field can have more children (not at max nesting depth)
  const canAddChild = (field: FormField) => {
    const nestingLevel = field.conditionalLogic?.nestingLevel || 0;
    return nestingLevel < 2; // Max depth is 2 (grandchild)
  };

  return (
    <div className="relative max-w-3xl mx-auto py-6 px-4 space-y-2" role="list" aria-label="Form fields">
      {/* Overlay when in child selection mode */}
      {isChildSelectionMode && (
        <div
          className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-start justify-center pt-12"
          onClick={onCancelChildSelection}
        >
          <div className="bg-background border-2 border-primary rounded-lg p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-medium mb-3">
              Select a field type from the left panel to add as child
            </p>
            <Button variant="outline" onClick={onCancelChildSelection} className="w-full">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Field list (greyed out when in selection mode) */}
      <div className={cn(isChildSelectionMode && 'opacity-30 pointer-events-none')}>
        {visibleFields.map((field, index) => (
          <FieldListItem
            key={field.id}
            field={field}
            isSelected={selectedFieldId === field.id}
            isFirst={index === 0}
            isLast={index === visibleFields.length - 1}
            canMoveUp={canMoveUp(index, field)}
            canMoveDown={canMoveDown(index, field)}
            showConditionalIndicators={showConditionalIndicators}
            onSelect={() => onFieldSelect(field.id)}
            onMoveUp={() => onFieldMove(field.id, 'up')}
            onMoveDown={() => onFieldMove(field.id, 'down')}
            onEdit={() => onFieldEdit(field.id)}
            onDelete={() => onFieldDelete(field.id)}
            onAddChild={
              supportsConditionalLogic(field.type) && canAddChild(field)
                ? () => onAddChildField(field.id)
                : undefined
            }
            isHovered={hoveredFieldId === field.id}
            onMouseEnter={() => setHoveredFieldId(field.id)}
            onMouseLeave={() => setHoveredFieldId(null)}
          />
        ))}
      </div>
    </div>
  );
}
