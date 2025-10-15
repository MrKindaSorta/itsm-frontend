import { useState } from 'react';
import type { Activity } from '@/types';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { MessageSquare, AlertCircle, ArrowRight, Reply, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActivityFeedProps {
  activities: Activity[];
}

interface MessageActionsProps {
  activityId: string;
  onReply: (activityId: string) => void;
  onFlag: (activityId: string) => void;
  isFlagged: boolean;
}

function MessageActions({ activityId, onReply, onFlag, isFlagged }: MessageActionsProps) {
  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => onReply(activityId)}
        title="Reply to this message"
      >
        <Reply className="h-3.5 w-3.5 mr-1" />
        Reply
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`h-7 px-2 text-xs ${isFlagged ? 'text-red-500 hover:text-red-600' : ''}`}
        onClick={() => onFlag(activityId)}
        title={isFlagged ? 'Unflag message' : 'Flag as important'}
      >
        <Flag className={`h-3.5 w-3.5 ${isFlagged ? 'fill-current' : ''}`} />
      </Button>
    </div>
  );
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const [flaggedMessages, setFlaggedMessages] = useState<Set<string>>(new Set());
  const [_replyingTo, setReplyingTo] = useState<string | null>(null);

  const handleReply = (activityId: string) => {
    setReplyingTo(activityId);
    // TODO: Focus reply textarea and add context
    console.log('Replying to:', activityId);
  };

  const handleFlag = (activityId: string) => {
    setFlaggedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      case 'internal_note':
        return <AlertCircle className="h-4 w-4" />;
      case 'status_change':
      case 'assignment':
        return <ArrowRight className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const isSystemUpdate = activity.type === 'status_change' || activity.type === 'assignment';
        const isInternalNote = activity.type === 'internal_note';
        const isFlagged = flaggedMessages.has(activity.id);

        if (isSystemUpdate) {
          return (
            <div key={activity.id} className="flex items-center gap-3 py-2">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{activity.author.name}</span> {activity.content.toLowerCase()}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatRelativeTime(activity.createdAt)}
                </p>
              </div>
            </div>
          );
        }

        return (
          <div
            key={activity.id}
            className={`group rounded-lg border p-4 ${
              isFlagged ? 'border-red-300 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20' :
              isInternalNote ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900' : 'bg-card'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium flex-shrink-0">
                {getInitials(activity.author.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{activity.author.name}</span>
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
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(activity.createdAt)}
                    </span>
                  </div>
                  <MessageActions
                    activityId={activity.id}
                    onReply={handleReply}
                    onFlag={handleFlag}
                    isFlagged={isFlagged}
                  />
                </div>
                <p className="text-sm mt-2 whitespace-pre-wrap">{activity.content}</p>
                {activity.attachments && activity.attachments.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {activity.attachments.map((attachment) => (
                      <div key={attachment.id} className="text-xs text-primary hover:underline cursor-pointer">
                        📎 {attachment.fileName}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
