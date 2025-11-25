import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, Unlock, AlertTriangle } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

interface UserUnlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string | null;
  userName: string | null;
}

export function UserUnlockModal({ open, onOpenChange, onSuccess, userId, userName }: UserUnlockModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      setError('No user selected');
      return;
    }

    if (!temporaryPassword || temporaryPassword.length < 6) {
      setError('Temporary password must be at least 6 characters');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetchWithAuth(`${API_BASE}/api/users/${userId}/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          temporaryPassword: temporaryPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTemporaryPassword('');
        onOpenChange(false);
        onSuccess();
      } else {
        setError(data.error || 'Failed to unlock user account');
      }
    } catch (err) {
      console.error('Unlock user error:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTemporaryPassword('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Unlock className="h-5 w-5 text-orange-600" />
            Unlock User Account
          </DialogTitle>
          <DialogDescription>
            Unlock the account for <strong>{userName}</strong>. You must set a temporary password that the user will be required to change on their next login.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">Security Notice</p>
                <p className="mt-1">
                  This account was locked after multiple failed login attempts.
                  The user will be required to change their password immediately after logging in with the temporary password.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="temporaryPassword">Temporary Password *</Label>
            <div className="relative">
              <Input
                id="temporaryPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter a temporary password"
                value={temporaryPassword}
                onChange={(e) => setTemporaryPassword(e.target.value)}
                disabled={isLoading}
                className="pr-10"
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Must be at least 6 characters. Share this password securely with the user.
            </p>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-700">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Unlocking...
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Unlock Account
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
