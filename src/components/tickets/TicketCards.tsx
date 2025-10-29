import { useNavigate } from 'react-router-dom';
import type { Ticket } from '@/types';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { Badge } from '@/components/ui/badge';
import { SLAIndicator } from './SLAIndicator';
import { formatRelativeTime } from '@/lib/utils';
import { Clock, User } from 'lucide-react';

interface TicketCardsProps {
  tickets: Ticket[];
  onTicketUpdate?: (ticketId: string, field: 'status' | 'priority' | 'assignee', value: string | null) => Promise<void>;
}

export function TicketCards({ tickets }: TicketCardsProps) {
  const navigate = useNavigate();

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No tickets found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <div
          key={ticket.id}
          onClick={() => navigate(`/agent/tickets/${ticket.id}`, { state: { ticket } })}
          className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-pointer"
        >
          {/* Header: ID + SLA */}
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs font-medium text-primary">
              {ticket.id}
            </span>
            {ticket.sla && <SLAIndicator sla={ticket.sla} />}
          </div>

          {/* Title */}
          <h4 className="font-semibold text-base leading-tight mb-3">
            {ticket.title}
          </h4>

          {/* Status & Priority Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <Badge variant="outline" className="text-[10px]">
              {ticket.category}
            </Badge>
          </div>

          {/* Metadata */}
          <div className="flex flex-col gap-2 text-xs text-muted-foreground">
            {/* Created Time */}
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatRelativeTime(ticket.createdAt)}</span>
            </div>

            {/* Requester */}
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>
                <span className="font-medium">Requester:</span> {ticket.requester.name}
              </span>
            </div>

            {/* Assignee */}
            <div className="flex items-center gap-2">
              <span className="font-medium">Assigned to:</span>
              {ticket.assignee ? (
                <span>{ticket.assignee.name}</span>
              ) : (
                <span className="text-muted-foreground italic">Unassigned</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
