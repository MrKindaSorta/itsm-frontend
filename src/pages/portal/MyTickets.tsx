import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/tickets/StatusBadge';
import { PriorityBadge } from '@/components/tickets/PriorityBadge';
import { SLAIndicator } from '@/components/tickets/SLAIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';
import { Search, Plus, Clock, Loader2 } from 'lucide-react';
import type { Ticket } from '@/types';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

export default function MyTickets() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tickets from API
  useEffect(() => {
    const fetchTickets = async () => {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/api/tickets`);
        const data = await response.json();

        if (data.success) {
          // Transform tickets to convert date strings to Date objects
          const transformedTickets = (data.tickets || []).map((ticket: any) => ({
            ...ticket,
            createdAt: new Date(ticket.createdAt),
            updatedAt: new Date(ticket.updatedAt),
            dueDate: ticket.dueDate ? new Date(ticket.dueDate) : undefined,
            resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt) : undefined,
            closedAt: ticket.closedAt ? new Date(ticket.closedAt) : undefined,
            sla: ticket.sla ? {
              ...ticket.sla,
              firstResponseDue: new Date(ticket.sla.firstResponseDue),
              resolutionDue: new Date(ticket.sla.resolutionDue),
            } : null,
          }));
          setTickets(transformedTickets);
        } else {
          setError(data.error || 'Failed to fetch tickets');
        }
      } catch (err) {
        console.error('Failed to fetch tickets:', err);
        setError('Failed to connect to server');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, [user]);

  // Filter tickets for current user (tickets they created)
  const userTickets = useMemo(() => {
    return tickets.filter(ticket => ticket.requester.id === user?.id);
  }, [tickets, user]);

  // Filter CC'd tickets (tickets where user is CC'd)
  const ccTickets = useMemo(() => {
    return tickets.filter(ticket =>
      ticket.ccUsers && ticket.ccUsers.some(ccUser => ccUser.id === user?.id)
    );
  }, [tickets, user]);

  // Combine all tickets (own + CC'd) with metadata and sort by date
  const allTickets = useMemo(() => {
    const owned = userTickets.map(t => ({ ...t, isCCd: false }));
    const ccd = ccTickets.map(t => ({ ...t, isCCd: true }));
    return [...owned, ...ccd].sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }, [userTickets, ccTickets]);

  // Apply search and filters to combined ticket list
  const filteredTickets = useMemo(() => {
    return allTickets.filter(ticket => {
      const matchesSearch =
        ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all'
        ? (ticket.status !== 'closed' && ticket.status !== 'resolved')
        : ticket.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [allTickets, searchQuery, statusFilter]);

  const getStatusCount = (status: string) => {
    if (status === 'all') {
      return allTickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').length;
    }
    return allTickets.filter(t => t.status === status).length;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Status Filter Tabs with New Ticket Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {/* Status Tabs - Scrollable on mobile */}
            <div className="flex-1 overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex gap-2 snap-x snap-mandatory">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  className="whitespace-nowrap snap-start"
                >
                  All ({getStatusCount('all')})
                </Button>
                <Button
                  variant={statusFilter === 'new' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('new')}
                  className="whitespace-nowrap snap-start"
                >
                  New ({getStatusCount('new')})
                </Button>
                <Button
                  variant={statusFilter === 'open' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('open')}
                  className="whitespace-nowrap snap-start"
                >
                  Open ({getStatusCount('open')})
                </Button>
                <Button
                  variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('in_progress')}
                  className="whitespace-nowrap snap-start"
                >
                  In Progress ({getStatusCount('in_progress')})
                </Button>
                <Button
                  variant={statusFilter === 'waiting' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('waiting')}
                  className="whitespace-nowrap snap-start"
                >
                  Waiting ({getStatusCount('waiting')})
                </Button>
                <Button
                  variant={statusFilter === 'resolved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('resolved')}
                  className="whitespace-nowrap snap-start"
                >
                  Resolved ({getStatusCount('resolved')})
                </Button>
                <Button
                  variant={statusFilter === 'closed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('closed')}
                  className="whitespace-nowrap snap-start"
                >
                  Closed ({getStatusCount('closed')})
                </Button>
              </div>
            </div>

            {/* New Ticket Button - Always visible */}
            <div className="flex-shrink-0">
              <Link to="/portal/tickets/create">
                <Button size="sm">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">New Ticket</span>
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>My Tickets ({filteredTickets.length})</CardTitle>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, title, or description..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading tickets...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Retry
              </Button>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'No tickets found matching your criteria.'
                  : 'You have no tickets yet. Create your first support request!'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Link to="/portal/tickets/create">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Ticket
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/portal/tickets/${ticket.id}`}
                  className="block"
                >
                  <div className="p-4 sm:p-5 border rounded-lg hover:bg-accent transition-colors">
                    {/* Mobile: Stack vertically | Desktop: Horizontal layout */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      {/* Left side content */}
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Ticket ID */}
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-medium text-muted-foreground">{ticket.id}</span>
                        </div>

                        {/* Title */}
                        <h4 className="font-semibold text-base leading-tight">{ticket.title}</h4>

                        {/* Badges - Mobile: Stack, Desktop: Inline */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={ticket.status} />
                          <PriorityBadge priority={ticket.priority} />
                          {ticket.isCCd && (
                            <Badge variant="outline" className="text-[10px] sm:text-xs bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                              CC'd
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] sm:text-xs hidden sm:inline-flex">
                            {ticket.category}
                          </Badge>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {ticket.description}
                        </p>

                        {/* Metadata - Mobile: Vertical stack, Desktop: Horizontal */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{formatDate(ticket.createdAt)}</span>
                          </div>
                          {ticket.isCCd && (
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium">Requested by</span>
                              <span>{ticket.requester.name}</span>
                            </div>
                          )}
                          {ticket.assignee && (
                            <div className="hidden sm:flex items-center gap-1.5">
                              <span className="font-medium">Assigned to</span>
                              <span>{ticket.assignee.name}</span>
                            </div>
                          )}
                          {/* Show category on mobile as text instead of badge */}
                          <div className="sm:hidden">
                            <span className="font-medium">Category:</span> {ticket.category}
                          </div>
                        </div>
                      </div>

                      {/* SLA Indicator - Below on mobile, Right side on desktop */}
                      <div className="sm:flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0">
                        <SLAIndicator sla={ticket.sla} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
