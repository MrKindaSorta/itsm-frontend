/**
 * Idle Timeout Warning Modal
 * Shows countdown before auto-logout due to inactivity
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface IdleTimeoutWarningProps {
  /**
   * Whether modal is open
   */
  open: boolean;

  /**
   * Warning duration in seconds
   */
  warningSeconds: number;

  /**
   * Callback when user clicks "Stay Logged In"
   */
  onStayLoggedIn: () => void;

  /**
   * Callback when user clicks "Logout" or countdown reaches zero
   */
  onLogout: () => void;
}

export function IdleTimeoutWarning({
  open,
  warningSeconds,
  onStayLoggedIn,
  onLogout,
}: IdleTimeoutWarningProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(warningSeconds);

  // Countdown timer
  useEffect(() => {
    if (!open) {
      setSecondsRemaining(warningSeconds);
      return;
    }

    // Start countdown
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, warningSeconds, onLogout]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <DialogTitle>Still there?</DialogTitle>
              <DialogDescription>
                You've been inactive for a while
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-6">
          <div className="text-center">
            <div className="text-6xl font-bold text-primary mb-2">
              {formatTime(secondsRemaining)}
            </div>
            <p className="text-sm text-muted-foreground">
              You will be automatically logged out due to inactivity
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onLogout}
            className="w-full sm:w-auto"
          >
            Logout Now
          </Button>
          <Button
            onClick={onStayLoggedIn}
            className="w-full sm:w-auto"
            autoFocus
          >
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
