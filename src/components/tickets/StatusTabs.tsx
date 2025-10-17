import { cn } from '@/lib/utils';
import type { TicketStatus, Ticket } from '@/types';

interface StatusTabsProps {
  tickets: Ticket[];
  activeStatus: TicketStatus | 'all';
  onStatusChange: (status: TicketStatus | 'all') => void;
}

interface StatusCount {
  label: string;
  value: TicketStatus | 'all';
  count: number;
  color: string;
}

export function StatusTabs({ tickets, activeStatus, onStatusChange }: StatusTabsProps) {
  const getStatusCount = (status: TicketStatus | 'all'): number => {
    if (status === 'all') return tickets.length;
    return tickets.filter(t => t.status === status).length;
  };

  const statusTabs: StatusCount[] = [
    { label: 'All Tickets', value: 'all', count: getStatusCount('all'), color: 'text-foreground' },
    { label: 'New', value: 'new', count: getStatusCount('new'), color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Open', value: 'open', count: getStatusCount('open'), color: 'text-purple-600 dark:text-purple-400' },
    { label: 'In Progress', value: 'in_progress', count: getStatusCount('in_progress'), color: 'text-orange-600 dark:text-orange-400' },
    { label: 'Waiting', value: 'waiting', count: getStatusCount('waiting'), color: 'text-yellow-600 dark:text-yellow-400' },
    { label: 'Resolved', value: 'resolved', count: getStatusCount('resolved'), color: 'text-green-600 dark:text-green-400' },
  ];

  return (
    <div className="border-b">
      <div className="flex gap-1 overflow-x-auto">
        {statusTabs.map((tab) => {
          const isActive = activeStatus === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => onStatusChange(tab.value)}
              className={cn(
                'relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors',
                'border-b-2 hover:text-primary hover:bg-muted/50',
                isActive
                  ? 'border-primary text-primary bg-muted/30'
                  : 'border-transparent text-muted-foreground'
              )}
            >
              <span className="flex items-center gap-2">
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {tab.count}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
