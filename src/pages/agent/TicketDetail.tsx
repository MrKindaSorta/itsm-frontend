import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { SelectRoot as Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/tickets/StatusBadge';
import { PriorityBadge } from '@/components/tickets/PriorityBadge';
import { SLAIndicator } from '@/components/tickets/SLAIndicator';
import { ActivityFeed } from '@/components/tickets/ActivityFeed';
import { UserMultiSelect } from '@/components/ui/user-multi-select';
import { formatDate, getInitials } from '@/lib/utils';
import type { Ticket, Activity, User } from '@/types';
import {
  ArrowLeft,
  Save,
  Send,
  Paperclip,
  HelpCircle,
  Loader2,
  Users as UsersIcon,
} from 'lucide-react';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [replyType, setReplyType] = useState<'public' | 'internal'>('public');
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyingToActivity, setReplyingToActivity] = useState<Activity | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isEditingCC, setIsEditingCC] = useState(false);
  const [tempCCUserIds, setTempCCUserIds] = useState<string[]>([]);

  // WebSocket for real-time updates
  const { connected, subscribeToTicket, unsubscribeFromTicket, on } = useWebSocket();

  // Subscribe to current ticket's updates
  useEffect(() => {
    if (!id) return;

    const ticketId = parseInt(id);
    subscribeToTicket(ticketId);

    return () => {
      unsubscribeFromTicket(ticketId);
    };
  }, [id, subscribeToTicket, unsubscribeFromTicket]);

  // Listen for real-time ticket updates
  useEffect(() => {
    const unsubTicketUpdated = on('ticket:updated', (message) => {
      if (message.ticketId === parseInt(id!)) {
        // Update ticket state with new data
        setTicket(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            status: message.data.status ?? prev.status,
            priority: message.data.priority ?? prev.priority,
            assignee_id: message.data.assignee_id ?? prev.assignee_id,
            assignee: message.data.assignee ?? prev.assignee,
          };
        });
      }
    });

    const unsubActivityCreated = on('activity:created', (message) => {
      if (message.ticketId === parseInt(id!)) {
        // Add new activity to the feed (prepend since newest first)
        const newActivity = {
          ...message.data,
          createdAt: new Date(message.data.createdAt),
        };
        setActivities(prev => [newActivity, ...prev]);
      }
    });

    const unsubActivityFlagged = on('activity:flagged', (message) => {
      if (message.ticketId === parseInt(id!)) {
        // Update flagged status in activities list
        setActivities(prev => prev.map(activity =>
          activity.id === message.data.activityId
            ? {
                ...activity,
                isFlagged: message.data.isFlagged,
                flaggedBy: message.data.flaggedBy,
                flaggedAt: message.data.flaggedAt,
              }
            : activity
        ));
      }
    });

    // Cleanup listeners
    return () => {
      unsubTicketUpdated();
      unsubActivityCreated();
      unsubActivityFlagged();
    };
  }, [id, on]);

  // Fetch ticket, activities, and users
  useEffect(() => {
    if (id) {
      fetchTicketData();
      fetchUsers();
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

        // Fetch activities
        const activitiesResponse = await fetch(`${API_BASE}/api/tickets/${id}/activities`);
        const activitiesData = await activitiesResponse.json();

        if (activitiesData.success) {
          const transformedActivities = activitiesData.activities.map((act: any) => ({
            ...act,
            createdAt: new Date(act.createdAt),
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

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/agent/tickets')}>
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
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/agent/tickets')}>
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

  // Handler for Quick Actions changes
  const handleQuickActionChange = async (field: 'status' | 'priority' | 'assignee', value: string) => {
    if (!ticket || !user) return;

    setIsSaving(true);
    try {
      const payload: any = {
        updated_by_id: user.id, // Include user ID for system activity tracking
      };

      if (field === 'status') {
        payload.status = value;
      } else if (field === 'priority') {
        payload.priority = value;
      } else if (field === 'assignee') {
        payload.assignee_id = value === 'unassigned' ? null : Number(value);
      }

      const response = await fetch(`${API_BASE}/api/tickets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        // Update ticket state
        setTicket({
          ...ticket,
          status: data.ticket.status,
          priority: data.ticket.priority,
          assignee: data.ticket.assignee,
          updatedAt: new Date(data.ticket.updatedAt),
        });

        // Refresh activities to show the update
        fetchTicketData();
      } else {
        alert('Failed to update ticket: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      alert('Failed to connect to server');
    } finally {
      setIsSaving(false);
    }
  };

  // Handler for flagging/unflagging an activity
  const handleFlagActivity = async (activity: Activity, flagged: boolean) => {
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE}/api/tickets/${id}/activities/${activity.id}/flag`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flagged: flagged,
          user_id: user.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the activity in the list
        setActivities(activities.map(act =>
          act.id === activity.id
            ? {
                ...act,
                isFlagged: data.activity.isFlagged,
                flaggedBy: data.activity.flaggedBy,
                flaggedAt: data.activity.flaggedAt,
              }
            : act
        ));
      } else {
        alert('Failed to flag activity: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error flagging activity:', error);
      alert('Failed to connect to server');
    }
  };

  // Handler for sending reply or note
  const handleSendReply = async () => {
    if (!replyContent.trim() || !user) return;

    setIsSending(true);
    try {
      const payload: any = {
        content: replyContent,
        author_id: user.id,
        type: replyType === 'internal' ? 'internal_note' : 'comment',
        isInternal: replyType === 'internal',
      };

      // If replying to an activity, include parent_activity_id
      if (replyingToActivity) {
        payload.parent_activity_id = replyingToActivity.id;
      }

      const response = await fetch(`${API_BASE}/api/tickets/${id}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        // Add new activity to the list
        const newActivity = {
          ...data.activity,
          createdAt: new Date(data.activity.createdAt),
        };
        setActivities([newActivity, ...activities]);
        setReplyContent('');
        setReplyingToActivity(null); // Clear reply context
      } else {
        alert('Failed to send reply: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to connect to server');
    } finally {
      setIsSending(false);
    }
  };

  // Handler for updating CC users
  const handleUpdateCCUsers = async () => {
    if (!ticket) return;

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/tickets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cc_user_ids: tempCCUserIds.map(id => Number(id)),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update ticket state with new CC users
        setTicket({
          ...ticket,
          ccUsers: data.ticket.ccUsers || [],
          updatedAt: new Date(data.ticket.updatedAt),
        });
        setIsEditingCC(false);
      } else {
        alert('Failed to update CC users: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating CC users:', error);
      alert('Failed to connect to server');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEditCC = () => {
    setIsEditingCC(true);
    setTempCCUserIds(ticket?.ccUsers.map(u => u.id) || []);
  };

  const handleCancelEditCC = () => {
    setIsEditingCC(false);
    setTempCCUserIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/agent/tickets')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{ticket.id}</h1>
              {connected && (
                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-pulse" />
                  <span>Live</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Created {formatDate(ticket.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Save className="h-3.5 w-3.5 mr-1.5" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Conversation */}
        <div className="lg:col-span-2">
          <Card className="flex flex-col h-[calc(100vh-10rem)]">
            <CardHeader className="border-b py-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Conversation</CardTitle>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant={replyType === 'public' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => setReplyType('public')}
                  >
                    Public Reply
                  </Button>
                  <Button
                    variant={replyType === 'internal' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => setReplyType('internal')}
                  >
                    Internal Note
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Reply Box */}
            <CardContent className="border-b p-3">
              <div className="space-y-2">
                {/* Reply Context Banner */}
                {replyingToActivity && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md text-xs">
                    <div className="flex-1">
                      <span className="font-medium">Replying to {replyingToActivity.author.name}</span>
                      <p className="text-muted-foreground truncate mt-0.5">
                        {replyingToActivity.content.substring(0, 60)}...
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setReplyingToActivity(null)}
                      title="Cancel reply"
                    >
                      ✕
                    </Button>
                  </div>
                )}
                <Textarea
                  placeholder={
                    replyType === 'public'
                      ? 'Type your reply to the user...'
                      : 'Add an internal note (only visible to agents)...'
                  }
                  rows={2}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="resize-none text-sm"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      <Paperclip className="h-3.5 w-3.5 mr-1.5" />
                      Attach
                    </Button>
                    <div className="group relative">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-popover text-popover-foreground text-xs rounded-md shadow-lg border z-10">
                        <p className="font-medium mb-1">Allowed file types:</p>
                        <p className="text-muted-foreground">
                          Images: JPG, PNG, GIF, WebP<br />
                          Documents: PDF, DOC, DOCX, TXT<br />
                          Spreadsheets: XLS, XLSX, CSV<br />
                          Archives: ZIP, RAR<br />
                          Max size: 10MB per file
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleSendReply}
                    disabled={isSending || !replyContent.trim()}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        Send {replyType === 'internal' ? 'Note' : 'Reply'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>

            {/* Activity Feed - Scrollable */}
            <CardContent className="flex-1 overflow-y-auto p-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/40">
              <ActivityFeed
                activities={activities}
                currentUserId={user?.id}
                onReply={(activity) => setReplyingToActivity(activity)}
                onFlag={handleFlagActivity}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base leading-snug mb-2">{ticket.title}</CardTitle>
              <div className="flex items-center gap-1.5 flex-wrap">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                <Badge variant="outline" className="text-xs">{ticket.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {/* Description */}
              <div className="pb-3 border-b">
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {ticket.description}
                </p>
              </div>

              {/* Requester */}
              <div className="pb-3 border-b">
                <h3 className="text-xs font-semibold mb-2 uppercase tracking-wide text-muted-foreground">Requester</h3>
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium flex-shrink-0">
                    {getInitials(ticket.requester.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{ticket.requester.name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{ticket.requester.email}</p>
                  </div>
                </div>
              </div>

              {/* CC Users */}
              <div className="pb-3 border-b">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">CC Users</h3>
                  {!isEditingCC && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs px-2"
                      onClick={handleStartEditCC}
                      disabled={isSaving}
                    >
                      Edit
                    </Button>
                  )}
                </div>

                {isEditingCC ? (
                  <div className="space-y-2">
                    <UserMultiSelect
                      users={users}
                      selectedUserIds={tempCCUserIds}
                      onChange={setTempCCUserIds}
                      placeholder="Select users to CC"
                      disabled={isSaving}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 text-xs flex-1"
                        onClick={handleUpdateCCUsers}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs flex-1"
                        onClick={handleCancelEditCC}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ticket.ccUsers && ticket.ccUsers.length > 0 ? (
                      ticket.ccUsers.map((ccUser) => (
                        <div key={ccUser.id} className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium flex-shrink-0">
                            {getInitials(ccUser.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{ccUser.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{ccUser.email}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                        <UsersIcon className="h-4 w-4" />
                        <span>No CC users</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="pb-3 border-b">
                <h3 className="text-xs font-semibold mb-2 uppercase tracking-wide text-muted-foreground">Quick Actions</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="status" className="text-xs text-muted-foreground">Status</Label>
                    <Select
                      value={ticket.status}
                      onValueChange={(value) => handleQuickActionChange('status', value)}
                      disabled={isSaving}
                    >
                      <SelectTrigger className="mt-1 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="waiting">Waiting</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority" className="text-xs text-muted-foreground">Priority</Label>
                    <Select
                      value={ticket.priority}
                      onValueChange={(value) => handleQuickActionChange('priority', value)}
                      disabled={isSaving}
                    >
                      <SelectTrigger className="mt-1 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="assignee" className="text-xs text-muted-foreground">Assignee</Label>
                    <Select
                      value={ticket.assignee?.id?.toString() || 'unassigned'}
                      onValueChange={(value) => handleQuickActionChange('assignee', value)}
                      disabled={isSaving}
                    >
                      <SelectTrigger className="mt-1 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {users.filter(u => u.role !== 'user').map((u) => (
                          <SelectItem key={u.id} value={u.id.toString()}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* SLA Status */}
              <div className="pb-3 border-b space-y-2">
                <h3 className="text-xs font-semibold mb-2 uppercase tracking-wide text-muted-foreground">SLA Status</h3>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Resolution Due</span>
                  <SLAIndicator sla={ticket.sla} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">First Response</span>
                  <span className={ticket.sla.firstResponseBreached ? 'text-red-500 font-medium' : 'text-green-600 font-medium'}>
                    {ticket.sla.firstResponseBreached ? 'Breached' : 'Met'}
                  </span>
                </div>
              </div>

              {/* Assigned To */}
              {ticket.assignee && (
                <div className="pb-3 border-b">
                  <h3 className="text-xs font-semibold mb-2 uppercase tracking-wide text-muted-foreground">Assigned To</h3>
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
                      {getInitials(ticket.assignee.name)}
                    </div>
                    <div>
                      <p className="text-xs font-medium">{ticket.assignee.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {'team' in ticket.assignee ? ticket.assignee.team : ticket.assignee.department}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold mb-2 uppercase tracking-wide text-muted-foreground">Details</h3>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium">{ticket.department}</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-muted-foreground">Tags</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {ticket.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs h-5 px-2">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Due Date</span>
                  <span className="font-medium">{ticket.dueDate ? formatDate(ticket.dueDate) : 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span className="font-medium">{formatDate(ticket.updatedAt)}</span>
                </div>
                {ticket.resolvedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Resolved</span>
                    <span className="font-medium">{formatDate(ticket.resolvedAt)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Attachments</span>
                  <span className="font-medium">{ticket.attachments.length || 'None'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
