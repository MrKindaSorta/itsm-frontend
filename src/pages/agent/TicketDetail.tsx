import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { usePermissions } from '@/hooks/usePermissions';
import { useTicketCache } from '@/contexts/TicketCacheContext';
import { usersCache } from '@/lib/usersCache';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SelectRoot as Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/tickets/StatusBadge';
import { PriorityBadge } from '@/components/tickets/PriorityBadge';
import { SLAIndicator } from '@/components/tickets/SLAIndicator';
import { ActivityFeed } from '@/components/tickets/ActivityFeed';
import { CustomFieldsDisplay } from '@/components/tickets/CustomFieldsDisplay';
import { UserMultiSelect } from '@/components/ui/user-multi-select';
import { formatDate, getInitials } from '@/lib/utils';
import type { Ticket, Activity, User } from '@/types';
import {
  ArrowLeft,
  Trash2,
  Send,
  Paperclip,
  HelpCircle,
  Loader2,
  Users as UsersIcon,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { can } = usePermissions();
  const ticketCache = useTicketCache();

  // Try to get ticket from navigation state or cache first
  const [ticket, setTicket] = useState<Ticket | null>(
    location.state?.ticket || (id ? ticketCache.getTicket(id) : null) || null
  );
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [replyType, setReplyType] = useState<'public' | 'internal'>('public');
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyingToActivity, setReplyingToActivity] = useState<Activity | null>(null);
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isEditingCC, setIsEditingCC] = useState(false);
  const [tempCCUserIds, setTempCCUserIds] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // WebSocket for real-time updates
  const { connected, subscribeToTicket, unsubscribeFromTicket, on } = useWebSocket();

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
          const updatedTicket = {
            ...prev,
            status: message.data.status ?? prev.status,
            priority: message.data.priority ?? prev.priority,
            assignee: message.data.assignee ?? prev.assignee,
          };
          // Update cache with latest data
          if (id) ticketCache.setTicket(id, updatedTicket);
          return updatedTicket;
        });
      }
    });

    const unsubActivityCreated = on('activity:created', (message) => {
      if (message.ticketId === id) {
        // Add new activity to the feed (prepend since newest first)
        const newActivity = {
          ...message.data,
          createdAt: new Date(message.data.createdAt),
        };
        // Only add if this activity doesn't already exist (prevent duplicates from optimistic updates)
        setActivities(prev => {
          const exists = prev.some(act => act.id === newActivity.id);
          if (exists) return prev;
          const updatedActivities = [newActivity, ...prev];
          // Update cache with new activity
          if (id) ticketCache.setActivities(id, updatedActivities);
          return updatedActivities;
        });
      }
    });

    const unsubActivityFlagged = on('activity:flagged', (message) => {
      if (message.ticketId === id) {
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

  // Fetch ticket, activities, and users (optimized with cache)
  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check if we already have ticket data (from state or cache)
        const hasTicket = ticket !== null;

        // Fetch users from cache first, then API if needed
        const cachedUsers = usersCache.get();
        if (cachedUsers) {
          setUsers(cachedUsers);
        } else {
          await fetchUsers();
        }

        // Fetch activities from cache or API
        const cachedActivities = ticketCache.getActivities(id);
        if (cachedActivities) {
          setActivities(cachedActivities);
        }

        // Only fetch ticket if we don't have it
        if (!hasTicket) {
          await fetchTicketData();
        } else {
          // If we have ticket but no activities, fetch activities only
          if (!cachedActivities) {
            await fetchActivities();
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading ticket data:', err);
        setError('Failed to load ticket data');
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  const fetchTicketData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch ticket with user_id to enable auto-open functionality
      const ticketResponse = await fetchWithAuth(`${API_BASE}/api/tickets/${id}?user_id=${user?.id || ''}`);
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
          sla: ticketData.ticket.sla ? {
            ...ticketData.ticket.sla,
            firstResponseDue: ticketData.ticket.sla.firstResponseDue ? new Date(ticketData.ticket.sla.firstResponseDue) : new Date(),
            resolutionDue: ticketData.ticket.sla.resolutionDue ? new Date(ticketData.ticket.sla.resolutionDue) : new Date(),
          } : null,
        };
        setTicket(transformedTicket);
        ticketCache.setTicket(id!, transformedTicket); // Cache the ticket

        // Fetch activities
        await fetchActivities();
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

  const fetchActivities = async () => {
    if (!id) return;

    try {
      const activitiesResponse = await fetchWithAuth(`${API_BASE}/api/tickets/${id}/activities`);
      const activitiesData = await activitiesResponse.json();

      if (activitiesData.success) {
        const transformedActivities = activitiesData.activities.map((act: any) => ({
          ...act,
          createdAt: new Date(act.createdAt),
        }));
        const orderedActivities = transformedActivities.reverse(); // Newest first
        setActivities(orderedActivities);
        ticketCache.setActivities(id, orderedActivities); // Cache the activities
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE}/api/users`);
      const data = await response.json();
      if (data.success) {
        const fetchedUsers = data.users || [];
        setUsers(fetchedUsers);
        usersCache.set(fetchedUsers); // Cache users for 5 minutes
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

      const response = await fetchWithAuth(`${API_BASE}/api/tickets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        // Update ticket state optimistically
        const updatedTicket = {
          ...ticket,
          status: data.ticket.status,
          priority: data.ticket.priority,
          assignee: data.ticket.assignee,
          updatedAt: new Date(data.ticket.updatedAt),
        };
        setTicket(updatedTicket);
        ticketCache.setTicket(id!, updatedTicket); // Update cache

        // WebSocket will handle real-time sync and activity updates
        // No need to refresh - the activity will arrive via WebSocket
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
      const response = await fetchWithAuth(`${API_BASE}/api/tickets/${id}/activities/${activity.id}/flag`, {
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

  // Handler for sending reply or note with optional status change
  const handleSendReply = async (newStatus?: string) => {
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

      const response = await fetchWithAuth(`${API_BASE}/api/tickets/${id}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        const activityId = data.activity.id;

        // Upload attachments if any (as a batch)
        if (attachmentFiles.length > 0) {
          setIsUploadingAttachments(true);
          try {
            const formData = new FormData();
            attachmentFiles.forEach((file) => {
              formData.append('files', file); // Use 'files' for multiple
            });
            formData.append('user_id', user.id);
            formData.append('activity_id', activityId);

            await fetchWithAuth(`${API_BASE}/api/tickets/${id}/attachments/batch`, {
              method: 'POST',
              body: formData,
            });
          } catch (uploadError) {
            console.error('Failed to upload attachments:', uploadError);
          } finally {
            setIsUploadingAttachments(false);
          }
        }

        // Add new activity to the list optimistically
        const newActivity = {
          ...data.activity,
          createdAt: new Date(data.activity.createdAt),
        };
        setActivities([newActivity, ...activities]);
        ticketCache.addActivity(id!, newActivity); // Update cache

        setReplyContent('');
        setReplyingToActivity(null); // Clear reply context
        setShowStatusOptions(false); // Close status options
        setAttachmentFiles([]); // Clear attachments

        // No need to refresh - attachments are already in the activity
        // WebSocket will sync with other users

        // If status change requested, update the ticket status
        if (newStatus && newStatus !== ticket?.status) {
          await handleQuickActionChange('status', newStatus);

          // Navigate back to tickets list if status is waiting, resolved, or closed
          if (newStatus === 'waiting' || newStatus === 'resolved' || newStatus === 'closed') {
            navigate('/agent/tickets');
          }
        }
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

  // Get smart status options based on current status (for Public Replies only)
  const getStatusOptions = () => {
    if (!ticket) return [];
    const currentStatus = ticket.status;
    const allStatuses: Array<{ value: string; label: string }> = [
      { value: 'open', label: 'Open' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'waiting', label: 'Waiting' },
      { value: 'resolved', label: 'Resolved' },
      { value: 'closed', label: 'Closed' },
    ];

    // Filter out current status and 'new' (tickets shouldn't go back to new)
    return allStatuses.filter(s => s.value !== currentStatus && s.value !== 'new');
  };

  // Handler for updating CC users
  const handleUpdateCCUsers = async () => {
    if (!ticket) return;

    setIsSaving(true);
    try {
      const response = await fetchWithAuth(`${API_BASE}/api/tickets/${id}`, {
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

  // Handler for deleting ticket
  const handleDeleteTicket = async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      const response = await fetchWithAuth(`${API_BASE}/api/tickets/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Navigate back to tickets list
        navigate('/agent/tickets');
      } else {
        alert('Failed to delete ticket: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert('Failed to connect to server');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle>Delete Ticket?</DialogTitle>
            </div>
            <DialogDescription className="pt-3">
              This will permanently delete ticket <span className="font-semibold text-foreground">{ticket?.id}</span> and
              all associated data including:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>All comments and internal notes</li>
                <li>All attachments</li>
                <li>Activity history</li>
              </ul>
              <p className="mt-3 font-semibold text-destructive">
                This action cannot be undone.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTicket}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        {can('ticket:delete') && (
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              disabled={isDeleting}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete Ticket
            </Button>
          </div>
        )}
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
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="attachment-input"
                        className="hidden"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            setAttachmentFiles([...attachmentFiles, ...Array.from(e.target.files)]);
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => document.getElementById('attachment-input')?.click()}
                        type="button"
                        disabled={isUploadingAttachments || isSending}
                      >
                        {isUploadingAttachments ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            Uploading {attachmentFiles.length > 0 && `(${attachmentFiles.length})`}
                          </>
                        ) : (
                          <>
                            <Paperclip className="h-3.5 w-3.5 mr-1.5" />
                            Attach
                          </>
                        )}
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
                    {attachmentFiles.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {attachmentFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs">
                            <span className="truncate max-w-[150px]">{file.name}</span>
                            <button
                              onClick={() => setAttachmentFiles(attachmentFiles.filter((_, i) => i !== index))}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* For Internal Notes: Simple Send Button */}
                  {replyType === 'internal' ? (
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleSendReply()}
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
                          Send Note
                        </>
                      )}
                    </Button>
                  ) : (
                    /* For Public Replies: Split Button with Dropdown */
                    <div className="relative">
                      <div className="flex">
                        {/* Main Send Button (70%) */}
                        <Button
                          size="sm"
                          className="h-7 text-xs rounded-r-none border-r-0 flex-[7]"
                          onClick={() => handleSendReply()}
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
                              Send Reply
                            </>
                          )}
                        </Button>
                        {/* Dropdown Trigger (30%) */}
                        <Button
                          size="sm"
                          className="h-7 w-7 p-0 rounded-l-none flex-[3]"
                          onClick={() => setShowStatusOptions(!showStatusOptions)}
                          disabled={isSending || !replyContent.trim()}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {/* Dropdown Menu */}
                      {showStatusOptions && (
                        <div className="absolute right-0 top-full mt-1 z-10 min-w-[200px] flex flex-col gap-1 p-2 bg-popover border rounded-md shadow-lg animate-in fade-in zoom-in-95 duration-200">
                          {getStatusOptions().map((statusOption) => (
                            <Button
                              key={statusOption.value}
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs justify-start"
                              onClick={() => handleSendReply(statusOption.value)}
                              disabled={isSending}
                            >
                              <Send className="h-3.5 w-3.5 mr-1.5" />
                              Send & Mark as {statusOption.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
                <Select
                  value={ticket.status}
                  onValueChange={(value) => handleQuickActionChange('status', value)}
                  disabled={isSaving}
                >
                  <SelectTrigger className="h-auto w-auto border-0 p-0 hover:opacity-80">
                    <StatusBadge status={ticket.status} />
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
                <Select
                  value={ticket.priority}
                  onValueChange={(value) => handleQuickActionChange('priority', value)}
                  disabled={isSaving}
                >
                  <SelectTrigger className="h-auto w-auto border-0 p-0 hover:opacity-80">
                    <PriorityBadge priority={ticket.priority} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
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

              {/* SLA Status - Only show if SLA is defined */}
              {ticket.sla && (
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
              )}

              {/* Assigned To */}
              <div className="pb-3 border-b">
                <h3 className="text-xs font-semibold mb-2 uppercase tracking-wide text-muted-foreground">Assigned To</h3>
                <Select
                  value={ticket.assignee?.id?.toString() || 'unassigned'}
                  onValueChange={(value) => handleQuickActionChange('assignee', value)}
                  disabled={isSaving}
                >
                  <SelectTrigger className="h-auto w-auto border-0 p-0 hover:opacity-80">
                    {ticket.assignee ? (
                      <div className="flex items-center gap-1.5">
                        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
                          {getInitials(ticket.assignee.name)}
                        </div>
                        <span className="text-sm font-medium">{ticket.assignee.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        <span className="text-xs font-medium">?</span>
                        <span className="text-xs font-medium">Unassigned</span>
                      </div>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          ?
                        </div>
                        <span>Unassigned</span>
                      </div>
                    </SelectItem>
                    {users.filter(u => u.role !== 'user').map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
                            {getInitials(u.name)}
                          </div>
                          <span>{u.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

                {/* Custom Fields - seamlessly integrated */}
                <CustomFieldsDisplay ticket={ticket} variant="agent" />

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
