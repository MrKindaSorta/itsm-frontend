import type { Activity } from '@/types';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { MessageSquare, AlertCircle, ArrowRight, Reply, Flag, Paperclip, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

interface ActivityFeedProps {
  activities: Activity[];
  currentUserId?: string;
  onReply?: (activity: Activity) => void;
  onFlag?: (activity: Activity, flagged: boolean) => void;
}

interface MessageActionsProps {
  activity: Activity;
  isOwn: boolean;
  onReply: (activity: Activity) => void;
  onFlag: (activity: Activity) => void;
}

function MessageActions({ activity, isOwn, onReply, onFlag }: MessageActionsProps) {
  const isFlagged = activity.isFlagged || false;

  return (
    <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'justify-end' : ''}`}>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs"
        onClick={() => onReply(activity)}
        title="Reply to this message"
      >
        <Reply className="h-3 w-3 mr-1" />
        Reply
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`h-6 px-2 text-xs ${isFlagged ? 'text-red-500 hover:text-red-600' : ''}`}
        onClick={() => onFlag(activity)}
        title={isFlagged ? 'Unflag message' : 'Flag as important'}
      >
        <Flag className={`h-3 w-3 ${isFlagged ? 'fill-current' : ''}`} />
      </Button>
    </div>
  );
}

export function ActivityFeed({ activities, currentUserId, onReply, onFlag }: ActivityFeedProps) {
  const handleReply = (activity: Activity) => {
    if (onReply) {
      onReply(activity);
    }
  };

  const handleFlag = (activity: Activity) => {
    if (onFlag) {
      const newFlaggedState = !activity.isFlagged;
      onFlag(activity, newFlaggedState);
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="h-3.5 w-3.5" />;
      case 'internal_note':
        return <AlertCircle className="h-3.5 w-3.5" />;
      case 'attachment':
        return <Paperclip className="h-3.5 w-3.5" />;
      case 'status_change':
      case 'assignment':
      case 'priority_change':
      case 'cc_change':
      case 'system':
        return <ArrowRight className="h-3.5 w-3.5" />;
      default:
        return <MessageSquare className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const isSystemUpdate = activity.type === 'status_change' || activity.type === 'assignment' || activity.type === 'priority_change' || activity.type === 'cc_change' || activity.type === 'system';
        const isAttachment = activity.type === 'attachment';
        const isInternalNote = activity.type === 'internal_note';
        const isFlagged = activity.isFlagged || false;
        const isOwnMessage = currentUserId && activity.author.id === currentUserId;

        // Attachment system message - centered with download button
        if (isAttachment) {
          const metadata = activity.metadata || {};
          return (
            <div key={activity.id} className="flex items-center justify-center py-2">
              <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg border">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Paperclip className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium text-foreground">{activity.author.name}</span>{' '}
                    <span className="text-muted-foreground">{activity.content}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatRelativeTime(activity.createdAt)}
                  </p>
                </div>
                <a
                  href={`${API_BASE}/api/attachments/${metadata.attachmentId}/download?user_id=${currentUserId}`}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Download
                  </Button>
                </a>
              </div>
            </div>
          );
        }

        // System updates - centered
        if (isSystemUpdate) {
          return (
            <div key={activity.id} className="flex items-center justify-center py-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full">
                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  {getActivityIcon(activity.type)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {activity.type === 'system' ? (
                    <>
                      <span className="font-medium text-foreground">{activity.content}</span>
                      {activity.author?.name && <> by <span className="font-medium text-foreground">{activity.author.name}</span></>}
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-foreground">{activity.author.name}</span> {activity.content.toLowerCase()}
                    </>
                  )}
                </p>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(activity.createdAt)}
                </span>
              </div>
            </div>
          );
        }

        // Chat messages - left or right aligned
        return (
          <div
            key={activity.id}
            className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            {/* Avatar - left side for others */}
            {!isOwnMessage && (
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium flex-shrink-0 mt-1">
                {getInitials(activity.author.name)}
              </div>
            )}

            {/* Message bubble */}
            <div className={`group flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
              {/* Author name - above bubble */}
              <div className={`text-xs font-medium text-muted-foreground px-1 mb-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                {activity.author.name}
              </div>

              {/* Bubble container */}
              <div
                className={`rounded-lg border p-3 ${
                  isFlagged
                    ? 'border-red-300 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20'
                    : isOwnMessage
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                {/* Badges */}
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  {isFlagged && (
                    <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 px-2 py-0.5 rounded flex items-center gap-1">
                      <Flag className="h-3 w-3 fill-current" />
                      Flagged
                    </span>
                  )}
                  {isInternalNote && (
                    <span className="text-xs bg-yellow-200 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-200 px-2 py-0.5 rounded">
                      Internal Note
                    </span>
                  )}
                </div>

                {/* Parent activity reference */}
                {activity.parentActivity && !activity.parentActivity.isInternal && (
                  <div className="mb-2 p-2 bg-muted/30 rounded text-xs border-l-2 border-primary/50">
                    <span className="text-muted-foreground">Replying to </span>
                    <span className="font-medium">{activity.parentActivity.author.name}</span>
                    <p className="text-muted-foreground mt-1 italic line-clamp-2">
                      "{activity.parentActivity.contentPreview}"
                    </p>
                  </div>
                )}

                {/* Message content */}
                <p className="text-sm whitespace-pre-wrap break-words">{activity.content}</p>

                {/* Attachments */}
                {activity.attachments && activity.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {activity.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={`${API_BASE}${attachment.url}?user_id=${currentUserId}`}
                        download
                        className="text-xs text-primary hover:underline cursor-pointer block"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        📎 {attachment.fileName}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Timestamp and actions - below bubble */}
              <div className={`flex items-center gap-2 mt-1 px-1 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(activity.createdAt)}
                </span>
                {onReply && onFlag && (
                  <MessageActions
                    activity={activity}
                    isOwn={!!isOwnMessage}
                    onReply={handleReply}
                    onFlag={handleFlag}
                  />
                )}
              </div>
            </div>

            {/* Avatar - right side for own messages */}
            {isOwnMessage && (
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium flex-shrink-0 mt-1">
                {getInitials(activity.author.name)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
