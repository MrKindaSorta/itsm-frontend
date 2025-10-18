import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

interface NotificationPreferences {
  ticketAssigned: boolean;
  ticketUpdated: boolean;
  ticketCommented: boolean;
  ticketCcUpdated: boolean;
  statusChanged: boolean;
  priorityChanged: boolean;
  slaWarning: boolean;
  ticketResolved: boolean;
  mention: boolean;
  activityFlagged: boolean;
}

interface NotificationSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationSettingsModal({ open, onOpenChange }: NotificationSettingsModalProps) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    ticketAssigned: true,
    ticketUpdated: true,
    ticketCommented: true,
    ticketCcUpdated: true,
    statusChanged: true,
    priorityChanged: true,
    slaWarning: true,
    ticketResolved: true,
    mention: true,
    activityFlagged: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch preferences on mount
  useEffect(() => {
    if (open && user) {
      fetchPreferences();
    }
  }, [open, user]);

  const fetchPreferences = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/notifications/preferences?userId=${user.id}`);
      const data = await response.json();

      if (data.success) {
        setPreferences(data.preferences);
      }
    } catch (err) {
      console.error('Error fetching preferences:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          preferences,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onOpenChange(false);
      } else {
        alert('Failed to save preferences');
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
      alert('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const notificationTypes = [
    {
      key: 'ticketAssigned' as keyof NotificationPreferences,
      label: 'Tickets assigned to me',
      description: 'Get notified when a ticket is assigned to you',
    },
    {
      key: 'ticketCommented' as keyof NotificationPreferences,
      label: 'New comments on my tickets',
      description: 'Get notified when someone comments on your tickets',
    },
    {
      key: 'ticketCcUpdated' as keyof NotificationPreferences,
      label: 'Tickets I\'m CC\'d on updated',
      description: 'Get notified when tickets you\'re CC\'d on have updates',
    },
    {
      key: 'statusChanged' as keyof NotificationPreferences,
      label: 'Status changes',
      description: 'Get notified when ticket status changes',
    },
    {
      key: 'priorityChanged' as keyof NotificationPreferences,
      label: 'Priority changes',
      description: 'Get notified when ticket priority changes',
    },
    {
      key: 'ticketResolved' as keyof NotificationPreferences,
      label: 'Ticket resolved',
      description: 'Get notified when tickets are resolved',
    },
    {
      key: 'slaWarning' as keyof NotificationPreferences,
      label: 'SLA warnings',
      description: 'Get notified when SLA deadlines are approaching',
    },
    {
      key: 'activityFlagged' as keyof NotificationPreferences,
      label: 'Activity flagged',
      description: 'Get notified when your comments are flagged',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Notification Settings</DialogTitle>
          <DialogDescription>
            Choose which notifications you want to receive. Note: All events are still logged, but
            only enabled types will be visible to you.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {notificationTypes.map((type) => (
              <div key={type.key} className="flex items-start justify-between space-x-3">
                <div className="flex-1 space-y-1">
                  <Label htmlFor={type.key} className="text-sm font-medium cursor-pointer">
                    {type.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {type.description}
                  </p>
                </div>
                <Switch
                  id={type.key}
                  checked={preferences[type.key]}
                  onCheckedChange={() => handleToggle(type.key)}
                />
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
