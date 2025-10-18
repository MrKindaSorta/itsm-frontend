import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PriorityBadge } from './PriorityBadge';
import { Check, Loader2 } from 'lucide-react';
import type { TicketPriority } from '@/types';
import { cn } from '@/lib/utils';

interface InlinePrioritySelectProps {
  priority: TicketPriority;
  onPriorityChange: (newPriority: TicketPriority) => Promise<void>;
  disabled?: boolean;
}

const priorityOptions: { value: TicketPriority; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'Non-urgent, can be handled later' },
  { value: 'medium', label: 'Medium', description: 'Standard priority' },
  { value: 'high', label: 'High', description: 'Important, needs prompt attention' },
  { value: 'urgent', label: 'Urgent', description: 'Critical issue requiring immediate action' },
];

export function InlinePrioritySelect({ priority, onPriorityChange, disabled }: InlinePrioritySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSelect = async (newPriority: TicketPriority) => {
    if (newPriority === priority) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    try {
      await onPriorityChange(newPriority);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update priority:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled || isUpdating}
          className="inline-flex items-center focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
          onClick={(e) => {
            e.stopPropagation(); // Prevent row click
          }}
        >
          <PriorityBadge priority={priority} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground px-2 py-1.5">Change Priority</p>
          {priorityOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              disabled={isUpdating}
              className={cn(
                "w-full flex items-start gap-3 px-2 py-2 rounded-md hover:bg-accent transition-colors text-left",
                isUpdating && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex-shrink-0 mt-0.5">
                {priority === option.value ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <div className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <PriorityBadge priority={option.value} />
                </div>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
              {isUpdating && priority === option.value && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
