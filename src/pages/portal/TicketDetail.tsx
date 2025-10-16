import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/tickets/StatusBadge';
import { PriorityBadge } from '@/components/tickets/PriorityBadge';
import { SLAIndicator } from '@/components/tickets/SLAIndicator';
import { ActivityFeed } from '@/components/tickets/ActivityFeed';
import { mockTickets } from '@/data/mockTickets';
import { mockActivities } from '@/data/mockActivities';
import { formatDate, getInitials } from '@/lib/utils';
import { ArrowLeft, Send, Tag, Users } from 'lucide-react';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comment, setComment] = useState('');

  // Find the ticket by ID
  const ticket = mockTickets.find((t) => t.id === id);
  // Get activities for this ticket (only public ones for user view)
  const activities = id
    ? [...(mockActivities[id] || [])]
        .filter(activity => !activity.isInternal)
        .reverse()
    : [];

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    console.log('Submitting comment:', comment);
    // In real app, this would submit to API
    setComment('');
  };

  if (!ticket) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/portal/tickets')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Ticket not found</p>
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
          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{ticket.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {ticket.description}
                </p>
              </div>

              {ticket.tags.length > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {ticket.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activities.length > 0 ? (
                <ActivityFeed activities={activities} />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No updates yet. An agent will respond shortly.
                </p>
              )}

              {canComment && (
                <form onSubmit={handleSubmitComment} className="pt-4 border-t">
                  <Textarea
                    placeholder="Add a comment or reply..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                  />
                  <div className="flex justify-end mt-2">
                    <Button type="submit" disabled={!comment.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Reply
                    </Button>
                  </div>
                </form>
              )}

              {!canComment && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground text-center">
                    This ticket is closed. Comments are disabled.
                  </p>
                </div>
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
