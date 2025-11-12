import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StatusBadge } from './StatusBadge';
import { Check } from 'lucide-react';
import type { TicketStatus } from '@/types';

interface InlineStatusSelectProps {
  status: TicketStatus;
  onStatusChange: (newStatus: TicketStatus) => Promise<void>;
  disabled?: boolean;
}

const statusOptions: { value: TicketStatus; label: string; description: string }[] = [
  { value: 'new', label: 'New', description: 'Newly created ticket' },
  { value: 'open', label: 'Open', description: 'Ticket acknowledged' },
  { value: 'in_progress', label: 'In Progress', description: 'Actively being worked on' },
  { value: 'waiting', label: 'Waiting', description: 'Awaiting response or action' },
  { value: 'resolved', label: 'Resolved', description: 'Issue has been fixed' },
  { value: 'closed', label: 'Closed', description: 'Ticket is complete' },
];

export function InlineStatusSelect({ status, onStatusChange, disabled }: InlineStatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (newStatus: TicketStatus) => {
    if (newStatus === status) {
      setIsOpen(false);
      return;
    }

    // Close popover immediately (optimistic UI)
    setIsOpen(false);

    // Fire the update in the background
    onStatusChange(newStatus).catch((error) => {
      console.error('Failed to update status:', error);
      // Error handling is done by the mutation hook (shows toast)
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className="inline-flex items-center focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
          onClick={(e) => {
            e.stopPropagation(); // Prevent row click
          }}
        >
          <StatusBadge status={status} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground px-2 py-1.5">Change Status</p>
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className="w-full flex items-start gap-3 px-2 py-2 rounded-md hover:bg-accent transition-colors text-left"
            >
              <div className="flex-shrink-0 mt-0.5">
                {status === option.value ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <div className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <StatusBadge status={option.value} />
                </div>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
