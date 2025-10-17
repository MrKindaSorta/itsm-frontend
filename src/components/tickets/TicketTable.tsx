import { useNavigate } from 'react-router-dom';
import type { Ticket } from '@/types';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { SLAIndicator } from './SLAIndicator';
import { SortableHeader, type SortDirection } from './SortableHeader';
import { formatRelativeTime, getInitials, type SortColumn } from '@/lib/utils';

interface TicketTableProps {
  tickets: Ticket[];
  sortColumn: SortColumn | null;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
}

export function TicketTable({ tickets, sortColumn, sortDirection, onSort }: TicketTableProps) {
  const navigate = useNavigate();

  const handleRowClick = (ticketId: string) => {
    navigate(`/agent/tickets/${ticketId}`);
  };

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="px-4 py-3 text-left">
                <SortableHeader
                  label="ID"
                  column="id"
                  currentColumn={sortColumn}
                  currentDirection={sortDirection}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <SortableHeader
                  label="Title"
                  column="title"
                  currentColumn={sortColumn}
                  currentDirection={sortDirection}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <SortableHeader
                  label="Status"
                  column="status"
                  currentColumn={sortColumn}
                  currentDirection={sortDirection}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <SortableHeader
                  label="Priority"
                  column="priority"
                  currentColumn={sortColumn}
                  currentDirection={sortDirection}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <SortableHeader
                  label="Assignee"
                  column="assignee"
                  currentColumn={sortColumn}
                  currentDirection={sortDirection}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <SortableHeader
                  label="Requester"
                  column="requester"
                  currentColumn={sortColumn}
                  currentDirection={sortDirection}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <SortableHeader
                  label="SLA"
                  column="sla"
                  currentColumn={sortColumn}
                  currentDirection={sortDirection}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <SortableHeader
                  label="Updated"
                  column="updated"
                  currentColumn={sortColumn}
                  currentDirection={sortDirection}
                  onSort={onSort}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No tickets found
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => handleRowClick(ticket.id)}
                  className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-mono font-medium text-primary">
                    {ticket.id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-md">
                      <p className="text-sm font-medium truncate">{ticket.title}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {ticket.category}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-4 py-3">
                    {ticket.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
                          {getInitials(ticket.assignee.name)}
                        </div>
                        <span className="text-sm">{ticket.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm">{ticket.requester.name}</p>
                      <p className="text-xs text-muted-foreground">{ticket.requester.department}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <SLAIndicator sla={ticket.sla} />
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatRelativeTime(ticket.updatedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
