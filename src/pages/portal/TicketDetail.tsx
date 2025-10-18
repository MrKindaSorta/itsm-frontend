import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/tickets/StatusBadge';
import { PriorityBadge } from '@/components/tickets/PriorityBadge';
import { SLAIndicator } from '@/components/tickets/SLAIndicator';
import { ActivityFeed } from '@/components/tickets/ActivityFeed';
import { formatDate, getInitials } from '@/lib/utils';
import type { Ticket, Activity } from '@/types';
import { ArrowLeft, Send, Tag, Loader2 } from 'lucide-react';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [comment, setComment] = useState('');
  const [isSending, setIsSending] = useState(false);

  // WebSocket for real-time updates
  const { subscribeToTicket, unsubscribeFromTicket, on } = useWebSocket();

  // Subscribe to current ticket's updates
  useEffect(() => {
    if (!id) return;

    subscribeToTicket(id);

    return () => {
      unsubscribeFromTicket(id);
    };
  }, [id, subscribeToTicket, unsubscribeFromTicket]);

  // Listen for real-time ticket updates
  useEffect(() => {
    const unsubTicketUpdated = on('ticket:updated', (message) => {
      if (message.ticketId === id) {
        // Update ticket state with new data
        setTicket(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            status: message.data.status ?? prev.status,
            priority: message.data.priority ?? prev.priority,
          };
        });
      }
    });

    const unsubActivityCreated = on('activity:created', (message) => {
      if (message.ticketId === id) {
        // Only add if not internal (portal users can't see internal notes)
        if (!message.data.isInternal) {
          const newActivity = {
            ...message.data,
            createdAt: new Date(message.data.createdAt),
          };
          // Only add if this activity doesn't already exist (prevent duplicates from optimistic updates)
          setActivities(prev => {
            const exists = prev.some(act => act.id === newActivity.id);
            if (exists) return prev;
            return [newActivity, ...prev];
          });
        }
      }
    });

    // Cleanup listeners
    return () => {
      unsubTicketUpdated();
      unsubActivityCreated();
    };
  }, [id, on]);

  // Fetch ticket and activities from API
  useEffect(() => {
    if (id) {
      fetchTicketData();
    }
  }, [id]);

  const fetchTicketData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch ticket
      const ticketResponse = await fetch(`${API_BASE}/api/tickets/${id}`);
      const ticketData = await ticketResponse.json();

      if (ticketData.success) {
        // Transform date strings to Date objects
        const transformedTicket = {
          ...ticketData.ticket,
          createdAt: new Date(ticketData.ticket.createdAt),
          updatedAt: new Date(ticketData.ticket.updatedAt),
          dueDate: ticketData.ticket.dueDate ? new Date(ticketData.ticket.dueDate) : undefined,
          resolvedAt: ticketData.ticket.resolvedAt ? new Date(ticketData.ticket.resolvedAt) : undefined,
          closedAt: ticketData.ticket.closedAt ? new Date(ticketData.ticket.closedAt) : undefined,
          sla: {
            ...ticketData.ticket.sla,
            firstResponseDue: ticketData.ticket.sla.firstResponseDue ? new Date(ticketData.ticket.sla.firstResponseDue) : new Date(),
            resolutionDue: ticketData.ticket.sla.resolutionDue ? new Date(ticketData.ticket.sla.resolutionDue) : new Date(),
          },
        };
        setTicket(transformedTicket);

        // Fetch activities (only public ones for user view)
        const activitiesResponse = await fetch(`${API_BASE}/api/tickets/${id}/activities`);
        const activitiesData = await activitiesResponse.json();

        if (activitiesData.success) {
          const transformedActivities = activitiesData.activities
            .filter((act: any) => !act.isInternal) // Filter out internal notes
            .map((act: any) => ({
              ...act,
              createdAt: new Date(act.createdAt),
              // Remove parentActivity if it references an internal note
              // Explicit === false check to guard against undefined/null/missing fields
              parentActivity: act.parentActivity?.isInternal === false
                ? act.parentActivity
                : null,
            }));
          setActivities(transformedActivities.reverse()); // Newest first
        }
      } else {
        setError(ticketData.error || 'Failed to fetch ticket');
      }
    } catch (err) {
      console.error('Error fetching ticket:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;

    setIsSending(true);
    try {
      const payload = {
        content: comment,
        author_id: user.id,
        type: 'comment',
        isInternal: false,
      };

      const response = await fetch(`${API_BASE}/api/tickets/${id}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        // Add new activity to the list at the beginning (newest first)
        const newActivity = {
          ...data.activity,
          createdAt: new Date(data.activity.createdAt),
        };
        setActivities([newActivity, ...activities]);
        setComment('');
      } else {
        alert('Failed to send comment: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending comment:', error);
      alert('Failed to connect to server');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/portal/tickets')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-3">Loading ticket...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/portal/tickets')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">{error || 'Ticket not found'}</p>
            <Button onClick={fetchTicketData} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canComment = ticket.status !== 'closed';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate('/portal/tickets')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Tickets
      </Button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{ticket.id}</h1>
          <p className="text-muted-foreground mt-1">Created {formatDate(ticket.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Conversation */}
          <Card className="flex flex-col h-[calc(100vh-10rem)]">
            <CardHeader className="border-b py-3 px-4">
              <CardTitle className="text-base">Conversation</CardTitle>
            </CardHeader>

            {/* Comment/Reply Box - At TOP */}
            {canComment ? (
              <CardContent className="border-b p-3">
                <form onSubmit={handleSubmitComment} className="space-y-2">
                  <Textarea
                    placeholder="Add a comment or reply..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="resize-none text-sm"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSending || !comment.trim()}
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Reply
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            ) : (
              <CardContent className="border-b p-3">
                <p className="text-sm text-muted-foreground text-center">
                  This ticket is closed. Comments are disabled.
                </p>
              </CardContent>
            )}

            {/* Activity Feed - Scrollable Below */}
            <CardContent className="flex-1 overflow-y-auto p-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/40">
              {activities.length > 0 ? (
                <ActivityFeed activities={activities} currentUserId={user?.id} />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No updates yet. An agent will respond shortly.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Title</p>
                <p className="font-medium">{ticket.title}</p>
              </div>

              <div>
                <p className="text-muted-foreground mb-1">Description</p>
                <p className="text-sm leading-relaxed">{ticket.description}</p>
              </div>

              {ticket.tags.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {ticket.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t">
                <p className="text-muted-foreground mb-1">Category</p>
                <Badge variant="outline">{ticket.category}</Badge>
              </div>

              <div>
                <p className="text-muted-foreground mb-1">Department</p>
                <p className="font-medium">{ticket.department}</p>
              </div>

              {ticket.assignee && (
                <div>
                  <p className="text-muted-foreground mb-2">Assigned To</p>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
                      {getInitials(ticket.assignee.name)}
                    </div>
                    <div>
                      <p className="font-medium">{ticket.assignee.name}</p>
                      {'team' in ticket.assignee && ticket.assignee.team && (
                        <p className="text-xs text-muted-foreground">{ticket.assignee.team}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* CC Users */}
              {ticket.ccUsers && ticket.ccUsers.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-2">CC'd Users</p>
                  <div className="space-y-2">
                    {ticket.ccUsers.map((ccUser) => (
                      <div key={ccUser.id} className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium">
                          {getInitials(ccUser.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{ccUser.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{ccUser.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-muted-foreground mb-1">SLA Status</p>
                <SLAIndicator sla={ticket.sla} />
              </div>

              <div className="pt-2 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">{formatDate(ticket.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span className="font-medium">{formatDate(ticket.updatedAt)}</span>
                </div>
                {ticket.dueDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Due Date</span>
                    <span className="font-medium">{formatDate(ticket.dueDate)}</span>
                  </div>
                )}
                {ticket.resolvedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Resolved</span>
                    <span className="font-medium">{formatDate(ticket.resolvedAt)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
