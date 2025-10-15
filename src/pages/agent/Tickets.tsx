import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Plus, Loader2 } from 'lucide-react';
import { TicketTable } from '@/components/tickets/TicketTable';
import type { Ticket } from '@/types';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

export default function Tickets() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          sla: {
            ...ticket.sla,
            firstResponseDue: ticket.sla.firstResponseDue ? new Date(ticket.sla.firstResponseDue) : new Date(),
            resolutionDue: ticket.sla.resolutionDue ? new Date(ticket.sla.resolutionDue) : new Date(),
          },
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

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== '') {
        fetchTickets();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Filter tickets based on search query (client-side backup)
  const filteredTickets = tickets.filter((ticket) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      ticket.id.toLowerCase().includes(searchLower) ||
      ticket.title.toLowerCase().includes(searchLower) ||
      ticket.requester?.name.toLowerCase().includes(searchLower) ||
      ticket.category.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tickets</h1>
          <p className="text-muted-foreground mt-2">Manage and track all support tickets</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Tickets ({filteredTickets.length})</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  className="pl-8 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
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
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchTickets} variant="outline">
                Retry
              </Button>
            </div>
          ) : (
            <TicketTable tickets={filteredTickets} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
