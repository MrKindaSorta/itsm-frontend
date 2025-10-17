import type { Activity } from '@/types';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { MessageSquare, AlertCircle, ArrowRight, Reply, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActivityFeedProps {
  activities: Activity[];
  onReply?: (activity: Activity) => void;
  onFlag?: (activity: Activity, flagged: boolean) => void;
}

interface MessageActionsProps {
  activity: Activity;
  onReply: (activity: Activity) => void;
  onFlag: (activity: Activity) => void;
}

function MessageActions({ activity, onReply, onFlag }: MessageActionsProps) {
  const isFlagged = activity.isFlagged || false;

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => onReply(activity)}
        title="Reply to this message"
      >
        <Reply className="h-3.5 w-3.5 mr-1" />
        Reply
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`h-7 px-2 text-xs ${isFlagged ? 'text-red-500 hover:text-red-600' : ''}`}
        onClick={() => onFlag(activity)}
        title={isFlagged ? 'Unflag message' : 'Flag as important'}
      >
        <Flag className={`h-3.5 w-3.5 ${isFlagged ? 'fill-current' : ''}`} />
      </Button>
    </div>
  );
}

export function ActivityFeed({ activities, onReply, onFlag }: ActivityFeedProps) {
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
        const isFlagged = activity.isFlagged || false;

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
            } ${activity.parentActivity ? 'ml-6 border-l-4 border-l-primary/30' : ''}`}
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
                    activity={activity}
                    onReply={handleReply}
                    onFlag={handleFlag}
                  />
                </div>
                {/* Show parent activity reference if this is a reply AND parent is not internal */}
                {activity.parentActivity && !activity.parentActivity.isInternal && (
                  <div className="mt-2 mb-2 p-2 bg-muted/50 rounded text-xs border-l-2 border-primary/50">
                    <span className="text-muted-foreground">Replying to </span>
                    <span className="font-medium">{activity.parentActivity.author.name}</span>
                    <p className="text-muted-foreground mt-1 italic">"{activity.parentActivity.contentPreview}"</p>
                  </div>
                )}
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
