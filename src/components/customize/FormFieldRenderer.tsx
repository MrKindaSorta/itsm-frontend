import type { FormField } from '@/types/formBuilder';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Type,
  AlignLeft,
  Hash,
  Calendar,
  ChevronDown,
  List,
  CheckSquare,
  Upload,
  Users,
  GripVertical,
  Trash2,
  Settings,
  Lock,
  Flag,
  FolderOpen,
  Eye,
  EyeOff,
  ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon mapping for field types
const fieldIcons = {
  text: Type,
  textarea: AlignLeft,
  number: Hash,
  date: Calendar,
  dropdown: ChevronDown,
  multiselect: List,
  checkbox: CheckSquare,
  file: Upload,
  cc_users: Users,
  priority: Flag,
  category: FolderOpen,
};

interface FormFieldRendererProps {
  field: FormField;
  index: number;
  isSelected: boolean;
  isDragging?: boolean;
  showConditionalDropZone?: boolean;
  isConditionalDropTarget?: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggleHidden?: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent) => void;
  onConditionalDrop?: (e: React.DragEvent) => void;
  onConditionalDragOver?: () => void;
  onConditionalDragLeave?: () => void;
}

export default function FormFieldRenderer({
  field,
  index: _index,
  isSelected,
  isDragging,
  showConditionalDropZone = false,
  isConditionalDropTarget = false,
  onSelect,
  onDelete,
  onToggleHidden,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
  onConditionalDrop,
  onConditionalDragOver,
  onConditionalDragLeave,
}: FormFieldRendererProps) {
  const Icon = fieldIcons[field.type];
  const canBeHidden = field.type === 'priority' || field.type === 'category';
  const hiddenWarning = field.type === 'priority'
    ? 'When hidden, all new tickets default to "Medium" priority'
    : 'When hidden, all new tickets default to "General" category';

  const handleDragOver = (e: React.DragEvent) => {
    onDragOver(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.stopPropagation();
    onDrop(e);
  };

  return (
    <div className="flex gap-1">
      {/* Main Field Tile - 70% or 100% width */}
      <div
        draggable
        onDragStart={onDragStart}
        onDragOver={handleDragOver}
        onDragLeave={onDragLeave}
        onDragEnd={onDragEnd}
        onDrop={handleDrop}
        onClick={onSelect}
        className={cn(
          'group relative p-4 rounded-lg border bg-card transition-all cursor-move',
          showConditionalDropZone ? 'flex-[7]' : 'flex-1',
          isSelected && 'border-primary ring-2 ring-primary/20',
          !isSelected && 'border-border hover:border-primary/50',
          isDragging && 'opacity-50',
          field.hidden && 'opacity-60 bg-muted'
        )}
      >
        {/* Drag Handle */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex items-start gap-3 pl-4 pointer-events-none">
          {/* Icon */}
          <div className="mt-0.5 p-2 rounded-md bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>

          {/* Field Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{field.label}</span>
              {field.isSystemField && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300">
                  <Lock className="h-3 w-3 mr-1" />
                  System Field
                </Badge>
              )}
              {field.required && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0">
                  Required
                </Badge>
              )}
              {field.hidden && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300">
                  <EyeOff className="h-3 w-3 mr-1" />
                  Hidden
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {field.type}
              </Badge>
            </div>
            {field.hidden && canBeHidden && (
              <div className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
                ⚠️ {hiddenWarning}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
            {canBeHidden && onToggleHidden && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleHidden();
                }}
                title={field.hidden ? 'Show field' : 'Hide field'}
              >
                {field.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              title="Configure field"
            >
              <Settings className="h-4 w-4" />
            </Button>
            {field.deletable !== false && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                title="Delete field"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Conditional Drop Zone - 30% width */}
      {showConditionalDropZone && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onConditionalDragOver?.();
          }}
          onDragLeave={(e) => {
            e.stopPropagation();
            onConditionalDragLeave?.();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onConditionalDrop?.(e);
          }}
          className={cn(
            'flex-[3] rounded-lg border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2 p-3',
            isConditionalDropTarget
              ? 'bg-purple-100 border-purple-500 dark:bg-purple-950 dark:border-purple-400 scale-105'
              : 'bg-purple-50 border-purple-300 hover:bg-purple-100 hover:border-purple-400 dark:bg-purple-950/30 dark:border-purple-700 dark:hover:bg-purple-950/50'
          )}
        >
          <ArrowDown className={cn(
            'h-6 w-6 transition-all',
            isConditionalDropTarget ? 'text-purple-600 dark:text-purple-300 animate-bounce' : 'text-purple-500 dark:text-purple-400'
          )} />
          <span className={cn(
            'text-xs font-medium text-center transition-all',
            isConditionalDropTarget ? 'text-purple-700 dark:text-purple-200' : 'text-purple-600 dark:text-purple-400'
          )}>
            Drop for conditional field
          </span>
        </div>
      )}
    </div>
  );
}
