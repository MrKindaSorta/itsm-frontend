import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Loader2, User, UserCheck, Settings } from 'lucide-react';
import { TicketTable } from '@/components/tickets/TicketTable';
import { TicketCreateModal } from '@/components/tickets/TicketCreateModal';
import { ColumnCustomizer } from '@/components/tickets/ColumnCustomizer';
import { StatusTabs } from '@/components/tickets/StatusTabs';
import { useAuth } from '@/contexts/AuthContext';
import { useViewPreferences } from '@/contexts/ViewPreferencesContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { sortTickets, type SortColumn, type SortDirection } from '@/lib/utils';
import type { Ticket, TicketStatus } from '@/types';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

export default function Tickets() {
  const { user } = useAuth();
  const { isLoading: isPreferencesLoading } = useViewPreferences();
  const { subscribeToGlobal, unsubscribeFromGlobal, on } = useWebSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isColumnCustomizerOpen, setIsColumnCustomizerOpen] = useState(false);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Filtering state
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all' | 'my_tickets'>('all');
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [showUnassigned, setShowUnassigned] = useState(false);

  // Subscribe to global WebSocket events for real-time ticket creation
  useEffect(() => {
    subscribeToGlobal();

    return () => {
      unsubscribeFromGlobal();
    };
  }, [subscribeToGlobal, unsubscribeFromGlobal]);

  // Listen for real-time ticket creation
  useEffect(() => {
    const unsubTicketCreated = on('ticket:created', (message) => {
      // Add new ticket to the beginning of the list
      const newTicket = {
        ...message.data,
        createdAt: new Date(message.data.createdAt),
        updatedAt: new Date(message.data.updatedAt),
        dueDate: message.data.dueDate ? new Date(message.data.dueDate) : undefined,
        resolvedAt: message.data.resolvedAt ? new Date(message.data.resolvedAt) : undefined,
        closedAt: message.data.closedAt ? new Date(message.data.closedAt) : undefined,
        sla: message.data.sla ? {
          ...message.data.sla,
          firstResponseDue: message.data.sla.firstResponseDue ? new Date(message.data.sla.firstResponseDue) : new Date(),
          resolutionDue: message.data.sla.resolutionDue ? new Date(message.data.sla.resolutionDue) : new Date(),
        } : null,
      };
      setTickets(prev => [newTicket, ...prev]);
    });

    return () => {
      unsubTicketCreated();
    };
  }, [on]);

  // Fetch tickets from API
  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_BASE}/api/tickets`);
      if (searchQuery) {
        url.searchParams.set('search', searchQuery);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.success) {
        // Transform date strings to Date objects
        const transformedTickets = data.tickets.map((ticket: any) => ({
          ...ticket,
          createdAt: new Date(ticket.createdAt),
          updatedAt: new Date(ticket.updatedAt),
          dueDate: ticket.dueDate ? new Date(ticket.dueDate) : undefined,
          resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt) : undefined,
          closedAt: ticket.closedAt ? new Date(ticket.closedAt) : undefined,
          sla: ticket.sla ? {
            ...ticket.sla,
            firstResponseDue: ticket.sla.firstResponseDue ? new Date(ticket.sla.firstResponseDue) : new Date(),
            resolutionDue: ticket.sla.resolutionDue ? new Date(ticket.sla.resolutionDue) : new Date(),
          } : null,
        }));
        setTickets(transformedTickets);
      } else {
        setError(data.error || 'Failed to fetch tickets');
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle inline ticket updates
  const handleTicketUpdate = async (ticketId: string, field: 'status' | 'priority' | 'assignee', value: string | null) => {
    if (!user) return;

    try {
      const payload: any = {
        updated_by_id: user.id,
      };

      if (field === 'status') {
        payload.status = value;
      } else if (field === 'priority') {
        payload.priority = value;
      } else if (field === 'assignee') {
        payload.assignee_id = value === null ? null : Number(value);
      }

      const response = await fetch(`${API_BASE}/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        // Update ticket in local state
        setTickets(prevTickets =>
          prevTickets.map(ticket =>
            ticket.id === ticketId
              ? {
                  ...ticket,
                  status: data.ticket.status,
                  priority: data.ticket.priority,
                  assignee: data.ticket.assignee,
                  updatedAt: new Date(data.ticket.updatedAt),
                }
              : ticket
          )
        );
      } else {
        alert('Failed to update ticket: ' + (data.error || 'Unknown error'));
        throw new Error(data.error || 'Failed to update ticket');
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      alert('Failed to connect to server');
      throw error;
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== '') {
        fetchTickets();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle sort
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Cycle through: null -> asc -> desc -> null
      if (sortDirection === null) {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filter tickets based on all active filters
  const filteredTickets = tickets.filter((ticket) => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        ticket.id.toLowerCase().includes(searchLower) ||
        ticket.title.toLowerCase().includes(searchLower) ||
        ticket.requester?.name.toLowerCase().includes(searchLower) ||
        ticket.category.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Status filter - handle 'my_tickets' special case
    if (statusFilter === 'my_tickets') {
      // Show only tickets assigned to current user
      if (ticket.assignee?.id !== user?.id) {
        return false;
      }
    } else if (statusFilter !== 'all' && ticket.status !== statusFilter) {
      return false;
    }

    // My Tickets filter (for desktop button)
    if (showMyTickets && ticket.assignee?.id !== user?.id) {
      return false;
    }

    // Unassigned filter
    if (showUnassigned && ticket.assignee !== undefined && ticket.assignee !== null) {
      return false;
    }

    return true;
  });

  // Apply sorting
  const sortedAndFilteredTickets = sortTickets(filteredTickets, sortColumn, sortDirection);

  // Count My Tickets
  const myTicketsCount = tickets.filter(t => t.assignee?.id === user?.id).length;
  const unassignedCount = tickets.filter(t => !t.assignee).length;

  return (
    <div className="space-y-6">
      <TicketCreateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={fetchTickets}
      />

      <ColumnCustomizer
        open={isColumnCustomizerOpen}
        onOpenChange={setIsColumnCustomizerOpen}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            {/* Title Section */}
            <div>
              <CardTitle className="text-xl">All Tickets ({sortedAndFilteredTickets.length})</CardTitle>
              <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
                Manage and track all support tickets
              </p>
            </div>

            {/* Actions - Mobile: Stack, Desktop: Horizontal */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Search - Full width on mobile */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filter buttons - Wrap on mobile */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant={showMyTickets ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setShowMyTickets(!showMyTickets);
                    if (!showMyTickets) setShowUnassigned(false);
                  }}
                  className="hidden md:flex"
                >
                  <UserCheck className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">My Tickets</span>
                  {myTicketsCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-background text-foreground">
                      {myTicketsCount}
                    </span>
                  )}
                </Button>

                <Button
                  variant={showUnassigned ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setShowUnassigned(!showUnassigned);
                    if (!showUnassigned) setShowMyTickets(false);
                  }}
                  className="hidden md:flex"
                >
                  <User className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Unassigned</span>
                  {unassignedCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-background text-foreground">
                      {unassignedCount}
                    </span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsColumnCustomizerOpen(true)}
                  className="hidden md:flex"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Columns
                </Button>

                <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Create</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Status Filter Tabs */}
        <StatusTabs
          tickets={tickets}
          activeStatus={statusFilter}
          onStatusChange={setStatusFilter}
          currentUser={user}
        />

        <CardContent className="pt-6">
          {isLoading || isPreferencesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">
                {isPreferencesLoading ? 'Loading preferences...' : 'Loading tickets...'}
              </span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchTickets} variant="outline">
                Retry
              </Button>
            </div>
          ) : (
            <TicketTable
              tickets={sortedAndFilteredTickets}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              onTicketUpdate={handleTicketUpdate}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
