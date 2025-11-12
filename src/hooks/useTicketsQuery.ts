import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import type { Ticket, TicketStatus, TicketPriority } from '@/types';
import { toast } from '@/hooks/use-toast';
import { usersCache } from '@/lib/usersCache';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

interface FetchTicketsParams {
  statusFilter?: TicketStatus | 'all' | 'my_tickets' | 'closed';
  searchQuery?: string;
}

interface TicketsResponse {
  success: boolean;
  tickets: any[];
  error?: string;
}

/**
 * Transform API ticket data to add Date objects
 */
function transformTicket(ticket: any): Ticket {
  return {
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
  };
}

/**
 * Fetch tickets from API
 */
async function fetchTickets(params: FetchTicketsParams): Promise<Ticket[]> {
  const url = new URL(`${API_BASE}/api/tickets`);

  // If viewing closed tickets specifically, fetch only closed
  if (params.statusFilter === 'closed') {
    url.searchParams.set('status', 'closed');
  } else {
    // For "all" and "my_tickets" views, exclude closed tickets
    url.searchParams.set('exclude_closed', 'true');
  }

  if (params.searchQuery) {
    url.searchParams.set('search', params.searchQuery);
  }

  const response = await fetchWithAuth(url.toString());
  const data: TicketsResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch tickets');
  }

  return data.tickets.map(transformTicket);
}

/**
 * Fetch closed ticket count
 */
async function fetchClosedTicketCount(): Promise<number> {
  const url = new URL(`${API_BASE}/api/tickets`);
  url.searchParams.set('status', 'closed');

  const response = await fetchWithAuth(url.toString());
  const data: TicketsResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch closed ticket count');
  }

  return data.tickets.length;
}

/**
 * React Query hook for fetching tickets
 * Provides automatic caching, background refetching, and request deduplication
 */
export function useTicketsQuery(
  params: FetchTicketsParams,
  options?: Omit<UseQueryOptions<Ticket[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Ticket[], Error>({
    queryKey: ['tickets', params.statusFilter, params.searchQuery],
    queryFn: () => fetchTickets(params),
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes (formerly cacheTime)
    retry: 2,
    refetchOnWindowFocus: true,
    ...options,
  });
}

/**
 * React Query hook for fetching closed ticket count
 */
export function useClosedTicketCountQuery(
  options?: Omit<UseQueryOptions<number, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<number, Error>({
    queryKey: ['tickets', 'closed-count'],
    queryFn: fetchClosedTicketCount,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2,
    refetchOnWindowFocus: false, // Don't refetch count on window focus
    ...options,
  });
}

/**
 * Hook to prefetch tickets (useful for login page)
 */
export function usePrefetchTickets() {
  const queryClient = useQueryClient();

  const prefetchTickets = async (params: FetchTicketsParams = {}) => {
    await queryClient.prefetchQuery({
      queryKey: ['tickets', params.statusFilter, params.searchQuery],
      queryFn: () => fetchTickets(params),
      staleTime: 2 * 60 * 1000,
    });
  };

  const prefetchClosedCount = async () => {
    await queryClient.prefetchQuery({
      queryKey: ['tickets', 'closed-count'],
      queryFn: fetchClosedTicketCount,
      staleTime: 5 * 60 * 1000,
    });
  };

  return { prefetchTickets, prefetchClosedCount };
}

/**
 * Mutation hook for updating tickets
 */
interface UpdateTicketParams {
  ticketId: string;
  field: 'status' | 'priority' | 'assignee';
  value: string | null;
  userId: string;
}

export function useUpdateTicketMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, field, value, userId }: UpdateTicketParams) => {
      const payload: any = {
        updated_by_id: userId,
      };

      if (field === 'status') {
        payload.status = value;
      } else if (field === 'priority') {
        payload.priority = value;
      } else if (field === 'assignee') {
        payload.assignee_id = value === null ? null : Number(value);
      }

      const response = await fetchWithAuth(`${API_BASE}/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update ticket');
      }

      return transformTicket(data.ticket);
    },
    // Optimistic update: Update cache immediately before API call
    onMutate: async ({ ticketId, field, value }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['tickets'] });

      // Snapshot the previous state for rollback
      const previousTickets = queryClient.getQueriesData<Ticket[]>({ queryKey: ['tickets'] });

      // Optimistically update all ticket queries
      queryClient.setQueriesData<Ticket[]>({ queryKey: ['tickets'] }, (old) => {
        if (!old || !Array.isArray(old)) return old;

        return old.map((ticket): Ticket => {
          if (ticket.id !== ticketId) return ticket;

          // Update the specific field
          if (field === 'status') {
            return { ...ticket, status: value as TicketStatus };
          } else if (field === 'priority') {
            return { ...ticket, priority: value as TicketPriority };
          } else if (field === 'assignee') {
            // For assignee, value is null or a user ID string
            if (value === null) {
              return { ...ticket, assignee: undefined };
            }

            // Look up full user data from cache for optimistic update
            const cachedUsers = usersCache.get();
            if (cachedUsers) {
              const selectedUser = cachedUsers.find((u) => u.id === value);
              if (selectedUser) {
                // Optimistically update with full user object
                return { ...ticket, assignee: selectedUser };
              }
            }

            // Fallback: If cache miss, keep existing assignee until API responds
            // This is unlikely since InlineAssigneeSelect already loads users to cache
            return ticket;
          }
          return ticket;
        });
      });

      // Return context with snapshot for rollback
      return { previousTickets };
    },
    // On error, rollback to previous state
    onError: (_error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousTickets) {
        context.previousTickets.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Show error toast
      const fieldName = variables.field === 'assignee' ? 'assignee' : variables.field;
      toast({
        title: 'Update failed',
        description: `Failed to update ${fieldName}. Changes have been reverted.`,
        variant: 'destructive',
      });
    },
    // On success, update cache with actual server data
    onSuccess: (updatedTicket) => {
      // Update all ticket queries with the actual server response
      queryClient.setQueriesData<Ticket[]>({ queryKey: ['tickets'] }, (old) => {
        if (!old || !Array.isArray(old)) return old;

        return old.map((ticket) =>
          ticket.id === updatedTicket.id ? updatedTicket : ticket
        );
      });
    },
    // Always refetch in the background to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}
