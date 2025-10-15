import type { TicketPriority } from '@/types';
import { Badge } from '@/components/ui/badge';
import { getPriorityColor } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: TicketPriority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const colorClass = getPriorityColor(priority);

  const priorityLabels: Record<TicketPriority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  };

  return (
    <Badge className={colorClass}>
      {priorityLabels[priority]}
    </Badge>
  );
}
