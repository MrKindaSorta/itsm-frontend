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
import { useTicketCache } from '@/contexts/TicketCacheContext';
import { useTicketsQuery, useClosedTicketCountQuery, useUpdateTicketMutation } from '@/hooks/useTicketsQuery';
import { sortTickets, type SortColumn, type SortDirection } from '@/lib/utils';
import type { Ticket, TicketStatus } from '@/types';

export default function Tickets() {
  const { user } = useAuth();
  const { isLoading: isPreferencesLoading } = useViewPreferences();
  const { subscribeToGlobal, unsubscribeFromGlobal, on } = useWebSocket();
  const ticketCache = useTicketCache();
  const updateTicketMutation = useUpdateTicketMutation();

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isColumnCustomizerOpen, setIsColumnCustomizerOpen] = useState(false);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Filtering state
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all' | 'my_tickets'>('all');
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [showUnassigned, setShowUnassigned] = useState(false);

  // React Query hooks - automatic caching and request deduplication
  const {
    data: ticketsData = [],
    isLoading: isLoadingTickets,
    error: ticketsError,
    refetch: refetchTickets
  } = useTicketsQuery({
    statusFilter,
    searchQuery: searchQuery || undefined,
  });

  const {
    data: closedTicketCount = 0,
  } = useClosedTicketCountQuery();

  // Cache tickets for instant detail page loading
  useEffect(() => {
    if (ticketsData) {
      ticketsData.forEach((ticket: Ticket) => {
        ticketCache.setTicket(ticket.id, ticket);
      });
    }
  }, [ticketsData, ticketCache]);

  // Subscribe to global WebSocket events for real-time ticket creation
  useEffect(() => {
    subscribeToGlobal();

    return () => {
      unsubscribeFromGlobal();
    };
  }, [subscribeToGlobal, unsubscribeFromGlobal]);

  // Listen for real-time ticket creation
  useEffect(() => {
    const unsubTicketCreated = on('ticket:created', () => {
      // Refetch tickets to get the new ticket with proper backend transform
      refetchTickets();
    });

    return () => {
      unsubTicketCreated();
    };
  }, [on, refetchTickets]);

  // Handle inline ticket updates using React Query mutation
  const handleTicketUpdate = async (ticketId: string, field: 'status' | 'priority' | 'assignee', value: string | null) => {
    if (!user) return;

    try {
      const updatedTicket = await updateTicketMutation.mutateAsync({
        ticketId,
        field,
        value,
        userId: user.id,
      });

      // Update cache with new ticket data
      ticketCache.setTicket(ticketId, updatedTicket);
    } catch (error) {
      console.error('Error updating ticket:', error);
      alert('Failed to update ticket: ' + (error instanceof Error ? error.message : 'Unknown error'));
      throw error;
    }
  };

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
  const filteredTickets = ticketsData.filter((ticket) => {
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

    // Status filter - handle special cases
    if (statusFilter === 'my_tickets') {
      // Show only tickets assigned to current user (excluding closed)
      if (ticket.assignee?.id !== user?.id) {
        return false;
      }
      // Also exclude closed tickets from My Tickets view
      if (ticket.status === 'closed') {
        return false;
      }
    } else if (statusFilter === 'all') {
      // Exclude closed tickets from "All Tickets" view
      // (Backend already filters, but double-check for safety)
      if (ticket.status === 'closed') {
        return false;
      }
    } else {
      // Filter by specific status (statusFilter is a TicketStatus here)
      if (ticket.status !== statusFilter) {
        return false;
      }
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

  // Count My Tickets (from active tickets only - exclude closed)
  const myTicketsCount = ticketsData.filter(t =>
    t.assignee?.id === user?.id && t.status !== 'closed'
  ).length;
  const unassignedCount = ticketsData.filter(t =>
    !t.assignee && t.status !== 'closed'
  ).length;

  return (
    <div className="space-y-6">
      <TicketCreateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={refetchTickets}
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

            {/* Actions - Horizontal on all screen sizes */}
            <div className="flex flex-row items-center gap-2">
              {/* Search - Takes available space */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filter buttons */}
              <div className="flex items-center gap-2">
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
          activeTickets={ticketsData.filter(t => t.status !== 'closed')}
          activeStatus={statusFilter}
          onStatusChange={setStatusFilter}
          currentUser={user}
          closedTicketsCount={closedTicketCount}
        />

        <CardContent className="pt-6">
          {isLoadingTickets || isPreferencesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">
                {isPreferencesLoading ? 'Loading preferences...' : 'Loading tickets...'}
              </span>
            </div>
          ) : ticketsError ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-destructive mb-4">
                {ticketsError instanceof Error ? ticketsError.message : 'Failed to load tickets'}
              </p>
              <Button onClick={() => refetchTickets()} variant="outline">
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
