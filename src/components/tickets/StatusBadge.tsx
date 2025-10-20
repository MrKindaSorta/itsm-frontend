import type { TicketStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { getStatusColor } from '@/lib/utils';

interface StatusBadgeProps {
  status: TicketStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass = getStatusColor(status);

  const statusLabels: Record<TicketStatus, string> = {
    new: 'New',
    open: 'Open',
    reopened: 'Re-Opened',
    in_progress: 'In Progress',
    waiting: 'Waiting',
    resolved: 'Resolved',
    closed: 'Closed',
  };

  return (
    <Badge className={colorClass}>
      {statusLabels[status]}
    </Badge>
  );
}
