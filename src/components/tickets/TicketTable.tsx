import { useNavigate } from 'react-router-dom';
import type { Ticket, ColumnConfig, TicketStatus, TicketPriority } from '@/types';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { SLAIndicator } from './SLAIndicator';
import { InlineStatusSelect } from './InlineStatusSelect';
import { InlinePrioritySelect } from './InlinePrioritySelect';
import { InlineAssigneeSelect } from './InlineAssigneeSelect';
import { SortableHeader, type SortDirection } from './SortableHeader';
import { formatRelativeTime, formatDate, getInitials, type SortColumn } from '@/lib/utils';
import { useViewPreferences } from '@/contexts/ViewPreferencesContext';
import { TicketCards } from './TicketCards';

interface TicketTableProps {
  tickets: Ticket[];
  sortColumn: SortColumn | null;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  onTicketUpdate?: (ticketId: string, field: 'status' | 'priority' | 'assignee', value: string | null) => Promise<void>;
}

export function TicketTable({ tickets, sortColumn, sortDirection, onSort, onTicketUpdate }: TicketTableProps) {
  const navigate = useNavigate();
  const { ticketColumns } = useViewPreferences();

  const handleRowClick = (ticket: Ticket) => {
    // Pass ticket data via navigation state for instant loading
    navigate(`/agent/tickets/${ticket.id}`, {
      state: { ticket }
    });
  };

  // Handlers for inline editing
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

  // Get visible columns sorted by order
  const visibleColumns = ticketColumns
    .filter((col) => col.visible)
    .sort((a, b) => a.order - b.order);

  // Render cell content based on column type
  const renderCellContent = (column: ColumnConfig, ticket: Ticket) => {
    switch (column.id) {
      case 'id':
        return (
          <span className="text-sm font-mono font-medium text-primary">
            {ticket.id}
          </span>
        );

      case 'title':
        return (
          <div className="max-w-md">
            <p className="text-sm font-medium truncate">{ticket.title}</p>
          </div>
        );

      case 'status':
        return onTicketUpdate ? (
          <InlineStatusSelect
            status={ticket.status}
            onStatusChange={(newStatus) => handleStatusChange(ticket.id, newStatus)}
          />
        ) : (
          <StatusBadge status={ticket.status} />
        );

      case 'priority':
        return onTicketUpdate ? (
          <InlinePrioritySelect
            priority={ticket.priority}
            onPriorityChange={(newPriority) => handlePriorityChange(ticket.id, newPriority)}
          />
        ) : (
          <PriorityBadge priority={ticket.priority} />
        );

      case 'category':
        return (
          <span className="text-sm text-muted-foreground">{ticket.category}</span>
        );

      case 'assignee':
        return onTicketUpdate ? (
          <InlineAssigneeSelect
            assignee={ticket.assignee && 'email' in ticket.assignee ? ticket.assignee : undefined}
            onAssigneeChange={(newAssigneeId) => handleAssigneeChange(ticket.id, newAssigneeId)}
          />
        ) : ticket.assignee ? (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
              {getInitials(ticket.assignee.name)}
            </div>
            <span className="text-sm">{ticket.assignee.name}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground italic">Unassigned</span>
        );

      case 'requester':
        return (
          <div>
            <p className="text-sm">{ticket.requester.name}</p>
            <p className="text-xs text-muted-foreground">{ticket.requester.department}</p>
          </div>
        );

      case 'department':
        return (
          <span className="text-sm text-muted-foreground">{ticket.department || '—'}</span>
        );

      case 'sla':
        return <SLAIndicator sla={ticket.sla} />;

      case 'created':
        return (
          <span className="text-sm text-muted-foreground">
            {formatRelativeTime(ticket.createdAt)}
          </span>
        );

      case 'updated':
        return (
          <span className="text-sm text-muted-foreground">
            {formatRelativeTime(ticket.updatedAt)}
          </span>
        );

      case 'dueDate':
        return ticket.dueDate ? (
          <span className="text-sm text-muted-foreground">
            {formatDate(ticket.dueDate)}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        );

      case 'tags':
        return (
          <div className="flex flex-wrap gap-1">
            {ticket.tags && ticket.tags.length > 0 ? (
              ticket.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
            {ticket.tags && ticket.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{ticket.tags.length - 3}
              </span>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Desktop: Table View */}
      <div className="hidden md:block rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-muted/50">
            <tr className="border-b">
              {visibleColumns.map((column) => (
                <th
                  key={column.id}
                  className="px-4 py-3 text-left"
                  style={{ width: column.width ? `${column.width}px` : 'auto' }}
                >
                  {column.sortable ? (
                    <SortableHeader
                      label={column.label}
                      column={column.id as SortColumn}
                      currentColumn={sortColumn}
                      currentDirection={sortDirection}
                      onSort={onSort}
                    />
                  ) : (
                    <span className="text-sm font-medium">{column.label}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  No tickets found
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => handleRowClick(ticket)}
                  className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  {visibleColumns.map((column) => (
                    <td
                      key={column.id}
                      className="px-4 py-3"
                      style={{ width: column.width ? `${column.width}px` : 'auto' }}
                    >
                      {renderCellContent(column, ticket)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>

      {/* Mobile: Card View */}
      <div className="md:hidden">
        <TicketCards
          tickets={tickets}
          onTicketUpdate={onTicketUpdate}
        />
      </div>
    </>
  );
}
