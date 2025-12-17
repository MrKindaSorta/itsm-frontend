import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, RotateCcw, Loader2 } from 'lucide-react';
import { useViewPreferences } from '@/contexts/ViewPreferencesContext';
import type { ColumnConfig } from '@/types';
import { cn, DEFAULT_TICKET_COLUMNS } from '@/lib/utils';

interface ColumnCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SortableColumnItemProps {
  column: ColumnConfig;
  onToggleVisibility: (id: string) => void;
}

function SortableColumnItem({ column, onToggleVisibility }: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 bg-card border rounded-lg',
        isDragging && 'opacity-50 z-50'
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <input
        type="checkbox"
        id={column.id}
        checked={column.visible}
        onChange={() => onToggleVisibility(column.id)}
        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
      />

      <label
        htmlFor={column.id}
        className="flex-1 text-sm font-medium cursor-pointer select-none"
      >
        {column.label}
      </label>

      <span className="text-xs text-muted-foreground">
        {column.width}px
      </span>
    </div>
  );
}

export function ColumnCustomizer({ open, onOpenChange }: ColumnCustomizerProps) {
  const { ticketColumns, updateTicketColumns, resetToDefault } = useViewPreferences();
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(ticketColumns);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Update local state when modal opens or ticketColumns change
  useState(() => {
    setLocalColumns(ticketColumns);
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalColumns((columns) => {
        const oldIndex = columns.findIndex((col) => col.id === active.id);
        const newIndex = columns.findIndex((col) => col.id === over.id);

        const reordered = arrayMove(columns, oldIndex, newIndex);

        // Update order property for each column
        return reordered.map((col, index) => ({
          ...col,
          order: index,
        }));
      });
    }
  };

  const handleToggleVisibility = (columnId: string) => {
    setLocalColumns((columns) =>
      columns.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateTicketColumns(localColumns);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save column preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetToDefault();
      setLocalColumns(DEFAULT_TICKET_COLUMNS);  // Update local state immediately
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      alert('Failed to reset preferences. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCancel = () => {
    // Reset local changes
    setLocalColumns(ticketColumns);
    onOpenChange(false);
  };

  const visibleCount = localColumns.filter((col) => col.visible).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customize Columns</DialogTitle>
          <DialogDescription>
            Drag to reorder columns, check/uncheck to show/hide them. Changes will be saved to your profile.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {visibleCount} of {localColumns.length} columns visible
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isSaving || isResetting}
            >
              {isResetting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Default
                </>
              )}
            </Button>
          </div>

          <div className="h-[400px] overflow-y-auto pr-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localColumns.map((col) => col.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {localColumns.map((column) => (
                    <SortableColumnItem
                      key={column.id}
                      column={column}
                      onToggleVisibility={handleToggleVisibility}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSaving || isResetting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isResetting}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
