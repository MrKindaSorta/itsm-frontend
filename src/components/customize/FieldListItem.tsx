import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { FormField } from '@/types/formBuilder';
import { formatConditionSummary } from '@/utils/conditionalLogicFormatters';
import {
  ChevronUp,
  ChevronDown,
  Settings,
  Trash2,
  Plus,
  Type,
  AlignLeft,
  Hash,
  Calendar,
  ChevronDown as DropdownIcon,
  List,
  CheckSquare,
  Upload,
  Users,
  Flag,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldListItemProps {
  field: FormField;
  allFields: FormField[];
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  showConditionalIndicators: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddChild?: () => void;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

// Icon mapping for field types
const FIELD_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  text: Type,
  textarea: AlignLeft,
  number: Hash,
  date: Calendar,
  dropdown: DropdownIcon,
  multiselect: List,
  checkbox: CheckSquare,
  file: Upload,
  cc_users: Users,
  priority: Flag,
  category: FolderOpen,
};

export default function FieldListItem({
  field,
  allFields,
  isSelected,
  canMoveUp,
  canMoveDown,
  showConditionalIndicators,
  onSelect,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  onAddChild,
  onMouseEnter,
  onMouseLeave,
}: FieldListItemProps) {
  const Icon = FIELD_ICONS[field.type] || Type;
  const nestingLevel = field.conditionalLogic?.nestingLevel || 0;
  const isSystemField = field.isSystemField && field.deletable === false;

  // Calculate indentation based on nesting level
  const getIndentation = () => {
    if (!showConditionalIndicators || nestingLevel === 0) return 'ml-0';
    if (nestingLevel === 1) return 'ml-8';
    if (nestingLevel === 2) return 'ml-16';
    return 'ml-0';
  };

  // Border color for conditional nesting visualization
  const getBorderColor = () => {
    if (!showConditionalIndicators || nestingLevel === 0) return '';
    if (nestingLevel === 1) return 'border-l-4 border-l-blue-500';
    if (nestingLevel === 2) return 'border-l-4 border-l-purple-500';
    return '';
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer',
        isSelected && 'border-primary bg-primary/5 shadow-sm',
        !isSelected && 'border-border hover:border-primary/50 hover:bg-accent/30',
        getIndentation(),
        getBorderColor()
      )}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      aria-label={`${field.label}, ${field.type} field${field.required ? ', required' : ''}`}
    >
      {/* Field Icon */}
      <div className="flex-shrink-0 text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>

      {/* Field Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </span>

          {/* Badges */}
          {isSystemField && (
            <Badge variant="secondary" className="text-xs">
              System
            </Badge>
          )}
          {field.conditionalLogic?.enabled && showConditionalIndicators && (
            <Badge variant="outline" className="text-xs">
              Conditional
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground capitalize">
          {field.type.replace('_', ' ')}
        </p>

        {/* Conditional field indicator - shows what triggers this field */}
        {field.conditionalLogic?.enabled &&
         (field.conditionalLogic?.nestingLevel || 0) > 0 && (
          <div className="text-[11px] mt-1 flex items-center gap-1">
            {field.conditionalLogic?.parentFieldId ? (
              <>
                <span className="text-orange-600 dark:text-orange-400 font-medium">Shows when</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  {(() => {
                    const parentField = allFields.find((f: FormField) => f.id === field.conditionalLogic?.parentFieldId);
                    return parentField?.label || '⚠️ Parent not found';
                  })()}
                </span>
                <span className="text-orange-600 dark:text-orange-400">
                  {formatConditionSummary(field.conditionalLogic?.conditions[0])}
                </span>
              </>
            ) : (
              <span className="text-destructive">⚠️ No parent field assigned</span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        {/* Move Up */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
          disabled={!canMoveUp}
          title={canMoveUp ? 'Move up' : 'Cannot move up'}
          aria-label={`Move ${field.label} up`}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>

        {/* Move Down */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
          disabled={!canMoveDown}
          title={canMoveDown ? 'Move down' : 'Cannot move down'}
          aria-label={`Move ${field.label} down`}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title="Edit settings"
          aria-label={`Edit ${field.label} settings`}
        >
          <Settings className="h-4 w-4" />
        </Button>

        {/* Delete */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 text-destructive hover:bg-destructive/10',
            isSystemField && 'opacity-50 cursor-not-allowed'
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (!isSystemField) {
              onDelete();
            }
          }}
          disabled={isSystemField}
          title={isSystemField ? 'Cannot delete system field' : 'Delete field'}
          aria-label={`Delete ${field.label}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        {/* Add Child (always visible for conditional-capable fields) */}
        {onAddChild && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 ml-2"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild();
            }}
            title="Add conditional child field"
            aria-label={`Add child field to ${field.label}`}
          >
            <Plus className="h-3 w-3" />
            Child
          </Button>
        )}
      </div>
    </div>
  );
}
