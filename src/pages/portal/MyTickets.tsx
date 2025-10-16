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
            sla: {
              ...ticket.sla,
              firstResponseDue: new Date(ticket.sla.firstResponseDue),
              resolutionDue: new Date(ticket.sla.resolutionDue),
            },
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

  // Apply search and filters to user tickets
  const filteredTickets = useMemo(() => {
    return userTickets.filter(ticket => {
      const matchesSearch =
        ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [userTickets, searchQuery, statusFilter]);

  // Apply search and filters to CC tickets
  const filteredCCTickets = useMemo(() => {
    return ccTickets.filter(ticket => {
      const matchesSearch =
        ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [ccTickets, searchQuery, statusFilter]);

  const getStatusCount = (status: string) => {
    if (status === 'all') return userTickets.length;
    return userTickets.filter(t => t.status === status).length;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Tickets</h1>
          <p className="text-muted-foreground mt-2">View and track your support requests</p>
        </div>
        <Link to="/portal/tickets/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All ({getStatusCount('all')})
            </Button>
            <Button
              variant={statusFilter === 'new' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('new')}
            >
              New ({getStatusCount('new')})
            </Button>
            <Button
              variant={statusFilter === 'open' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('open')}
            >
              Open ({getStatusCount('open')})
            </Button>
            <Button
              variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('in_progress')}
            >
              In Progress ({getStatusCount('in_progress')})
            </Button>
            <Button
              variant={statusFilter === 'waiting' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('waiting')}
            >
              Waiting ({getStatusCount('waiting')})
            </Button>
            <Button
              variant={statusFilter === 'resolved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('resolved')}
            >
              Resolved ({getStatusCount('resolved')})
            </Button>
            <Button
              variant={statusFilter === 'closed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('closed')}
            >
              Closed ({getStatusCount('closed')})
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
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
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/portal/tickets/${ticket.id}`}
                  className="block"
                >
                  <div className="p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-medium">{ticket.id}</span>
                          <StatusBadge status={ticket.status} />
                          <PriorityBadge priority={ticket.priority} />
                        </div>
                        <h4 className="font-medium mb-1 truncate">{ticket.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {ticket.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Created {formatDate(ticket.createdAt)}
                          </div>
                          {ticket.assignee && (
                            <div>Assigned to {ticket.assignee.name}</div>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {ticket.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
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

      {/* CC'd Tickets Section */}
      {filteredCCTickets.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary" className="h-5">CC</Badge>
                CC'd Tickets ({filteredCCTickets.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Tickets where you've been CC'd
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredCCTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/portal/tickets/${ticket.id}`}
                  className="block"
                >
                  <div className="p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-medium">{ticket.id}</span>
                          <StatusBadge status={ticket.status} />
                          <PriorityBadge priority={ticket.priority} />
                          <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                            CC'd
                          </Badge>
                        </div>
                        <h4 className="font-medium mb-1 truncate">{ticket.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {ticket.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Created {formatDate(ticket.createdAt)}
                          </div>
                          <div>Requested by {ticket.requester.name}</div>
                          {ticket.assignee && (
                            <div>Assigned to {ticket.assignee.name}</div>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {ticket.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <SLAIndicator sla={ticket.sla} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
