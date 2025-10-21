import { cn } from '@/lib/utils';
import type { TicketStatus, Ticket, User } from '@/types';

interface StatusTabsProps {
  tickets: Ticket[];
  activeStatus: TicketStatus | 'all' | 'my_tickets';
  onStatusChange: (status: TicketStatus | 'all' | 'my_tickets') => void;
  currentUser?: User | null;
  closedTicketCount?: number;
}

interface StatusCount {
  label: string;
  value: TicketStatus | 'all' | 'my_tickets';
  count: number;
  color: string;
  mobileVisible?: boolean;
}

export function StatusTabs({ tickets, activeStatus, onStatusChange, currentUser, closedTicketCount = 0 }: StatusTabsProps) {
  const getStatusCount = (status: TicketStatus | 'all' | 'my_tickets'): number => {
    if (status === 'all') return tickets.length;
    if (status === 'my_tickets') {
      return tickets.filter(t => t.assignee?.id === currentUser?.id).length;
    }
    // Use prop for closed count (pre-fetched separately)
    if (status === 'closed') {
      return closedTicketCount;
    }
    return tickets.filter(t => t.status === status).length;
  };

  const statusTabs: StatusCount[] = [
    { label: 'All Tickets', value: 'all', count: getStatusCount('all'), color: 'text-foreground', mobileVisible: true },
    { label: 'My Tickets', value: 'my_tickets', count: getStatusCount('my_tickets'), color: 'text-foreground', mobileVisible: true },
    { label: 'New', value: 'new', count: getStatusCount('new'), color: 'text-blue-600 dark:text-blue-400', mobileVisible: false },
    { label: 'Open', value: 'open', count: getStatusCount('open'), color: 'text-purple-600 dark:text-purple-400', mobileVisible: false },
    { label: 'In Progress', value: 'in_progress', count: getStatusCount('in_progress'), color: 'text-orange-600 dark:text-orange-400', mobileVisible: false },
    { label: 'Waiting', value: 'waiting', count: getStatusCount('waiting'), color: 'text-yellow-600 dark:text-yellow-400', mobileVisible: false },
    { label: 'Resolved', value: 'resolved', count: getStatusCount('resolved'), color: 'text-green-600 dark:text-green-400', mobileVisible: false },
    { label: 'Closed', value: 'closed', count: getStatusCount('closed'), color: 'text-gray-600 dark:text-gray-400', mobileVisible: true },
  ];

  return (
    <div className="border-b">
      <div className="flex gap-1 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-2 md:px-0">
        {statusTabs.map((tab) => {
          const isActive = activeStatus === tab.value;
          // Hide tabs based on mobileVisible flag
          const hiddenClass = tab.mobileVisible === false ? 'hidden md:flex' : '';

          return (
            <button
              key={tab.value}
              onClick={() => onStatusChange(tab.value)}
              className={cn(
                'relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors snap-start',
                'border-b-2 hover:text-primary hover:bg-muted/50',
                isActive
                  ? 'border-primary text-primary bg-muted/30'
                  : 'border-transparent text-muted-foreground',
                hiddenClass
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
