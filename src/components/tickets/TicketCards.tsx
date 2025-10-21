import { useNavigate } from 'react-router-dom';
import type { Ticket, TicketStatus, TicketPriority } from '@/types';
import { Badge } from '@/components/ui/badge';
import { InlineStatusSelect } from './InlineStatusSelect';
import { InlinePrioritySelect } from './InlinePrioritySelect';
import { InlineAssigneeSelect } from './InlineAssigneeSelect';
import { SLAIndicator } from './SLAIndicator';
import { formatRelativeTime } from '@/lib/utils';
import { Clock, User } from 'lucide-react';

interface TicketCardsProps {
  tickets: Ticket[];
  onTicketUpdate?: (ticketId: string, field: 'status' | 'priority' | 'assignee', value: string | null) => Promise<void>;
}

export function TicketCards({ tickets, onTicketUpdate }: TicketCardsProps) {
  const navigate = useNavigate();

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    if (onTicketUpdate) {
      await onTicketUpdate(ticketId, 'status', newStatus);
    }
  };

  const handlePriorityChange = async (ticketId: string, newPriority: TicketPriority) => {
    if (onTicketUpdate) {
      await onTicketUpdate(ticketId, 'priority', newPriority);
    }
  };

  const handleAssigneeChange = async (ticketId: string, newAssigneeId: string | null) => {
    if (onTicketUpdate) {
      await onTicketUpdate(ticketId, 'assignee', newAssigneeId);
    }
  };

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
          className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
        >
          {/* Header: ID + SLA */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate(`/agent/tickets/${ticket.id}`)}
              className="font-mono text-xs font-medium text-primary hover:underline"
            >
              {ticket.id}
            </button>
            {ticket.sla && <SLAIndicator sla={ticket.sla} />}
          </div>

          {/* Title - Clickable */}
          <button
            onClick={() => navigate(`/agent/tickets/${ticket.id}`)}
            className="w-full text-left"
          >
            <h4 className="font-semibold text-base leading-tight mb-3 hover:text-primary transition-colors">
              {ticket.title}
            </h4>
          </button>

          {/* Inline Editable Status & Priority */}
          <div className="flex flex-wrap items-center gap-2 mb-3" onClick={(e) => e.stopPropagation()}>
            {onTicketUpdate ? (
              <>
                <InlineStatusSelect
                  status={ticket.status}
                  onStatusChange={(newStatus) => handleStatusChange(ticket.id, newStatus)}
                />
                <InlinePrioritySelect
                  priority={ticket.priority}
                  onPriorityChange={(newPriority) => handlePriorityChange(ticket.id, newPriority)}
                />
              </>
            ) : (
              <>
                <Badge>{ticket.status}</Badge>
                <Badge>{ticket.priority}</Badge>
              </>
            )}
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

            {/* Assignee - Inline Editable */}
            <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
              <span className="font-medium">Assigned to:</span>
              {onTicketUpdate ? (
                <InlineAssigneeSelect
                  assignee={ticket.assignee && 'email' in ticket.assignee ? ticket.assignee : undefined}
                  onAssigneeChange={(newAssigneeId) => handleAssigneeChange(ticket.id, newAssigneeId)}
                />
              ) : ticket.assignee ? (
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
