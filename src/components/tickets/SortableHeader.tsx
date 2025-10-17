import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SortColumn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc' | null;

interface SortableHeaderProps {
  label: string;
  column: SortColumn;
  currentColumn: SortColumn | null;
  currentDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  className?: string;
}

export function SortableHeader({
  label,
  column,
  currentColumn,
  currentDirection,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = currentColumn === column;

  const getSortIcon = () => {
    if (!isActive || currentDirection === null) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-40 transition-opacity" />;
    }
    if (currentDirection === 'asc') {
      return <ArrowUp className="h-3 w-3 ml-1 text-primary" />;
    }
    return <ArrowDown className="h-3 w-3 ml-1 text-primary" />;
  };

  return (
    <button
      onClick={() => onSort(column)}
      className={cn(
        'group flex items-center text-left text-sm font-medium hover:text-primary transition-colors',
        isActive && 'text-primary font-semibold',
        className
      )}
    >
      {label}
      {getSortIcon()}
    </button>
  );
}
