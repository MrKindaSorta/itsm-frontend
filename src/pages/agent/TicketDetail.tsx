import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/tickets/StatusBadge';
import { PriorityBadge } from '@/components/tickets/PriorityBadge';
import { SLAIndicator } from '@/components/tickets/SLAIndicator';
import { ActivityFeed } from '@/components/tickets/ActivityFeed';
import { mockTickets } from '@/data/mockTickets';
import { mockActivities } from '@/data/mockActivities';
import { formatDate, getInitials } from '@/lib/utils';
import {
  ArrowLeft,
  Save,
  Send,
  Paperclip,
  HelpCircle,
} from 'lucide-react';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [replyType, setReplyType] = useState<'public' | 'internal'>('public');
  const [replyContent, setReplyContent] = useState('');

  // Find the ticket by ID
  const ticket = mockTickets.find((t) => t.id === id);
  // Reverse activities to show newest first
  const activities = id ? [...(mockActivities[id] || [])].reverse() : [];

  if (!ticket) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/agent/tickets')}>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/agent/tickets')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{ticket.id}</h1>
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
                  <Button size="sm" className="h-7 text-xs">
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Send {replyType === 'internal' ? 'Note' : 'Reply'}
                  </Button>
                </div>
              </div>
            </CardContent>

            {/* Activity Feed - Scrollable */}
            <CardContent className="flex-1 overflow-y-auto p-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/40">
              <ActivityFeed activities={activities} />
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

              {/* Quick Actions */}
              <div className="pb-3 border-b">
                <h3 className="text-xs font-semibold mb-2 uppercase tracking-wide text-muted-foreground">Quick Actions</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="status" className="text-xs text-muted-foreground">Status</Label>
                    <Select id="status" defaultValue={ticket.status} className="mt-1 h-8 text-xs py-1 px-2">
                      <option value="new">New</option>
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="waiting">Waiting</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority" className="text-xs text-muted-foreground">Priority</Label>
                    <Select id="priority" defaultValue={ticket.priority} className="mt-1 h-8 text-xs py-1 px-2">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="assignee" className="text-xs text-muted-foreground">Assignee</Label>
                    <Select id="assignee" defaultValue={ticket.assignee?.id || 'unassigned'} className="mt-1 h-8 text-xs py-1 px-2">
                      <option value="unassigned">Unassigned</option>
                      <option value="agent-1">John Smith</option>
                      <option value="agent-2">Lisa Wong</option>
                      <option value="agent-3">Robert Taylor</option>
                      <option value="agent-4">Thomas Anderson</option>
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
