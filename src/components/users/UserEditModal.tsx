import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectRoot as Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Eye, EyeOff, Key } from 'lucide-react';
import { isValidEmail } from '@/lib/utils';
import type { User } from '@/types';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

interface UserEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  user: User | null;
}

export function UserEditModal({ open, onOpenChange, onSuccess, user }: UserEditModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    department: '',
    team: '',
    active: true,
  });

  const roles = [
    { value: 'user', label: 'User' },
    { value: 'agent', label: 'Agent' },
    { value: 'manager', label: 'Manager' },
    { value: 'admin', label: 'Admin' },
  ];

  // Update form when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || '',
        team: user.team || '',
        active: user.active,
      });
      setShowPasswordSection(false);
      setNewPassword('');
      setError(null);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);

    // Validate email
    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate password if changing it
    if (showPasswordSection && newPassword && newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      // Update user details
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department || null,
        team: formData.team || null,
        active: formData.active,
      };

      const response = await fetch(`${API_BASE}/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to update user');
        setIsLoading(false);
        return;
      }

      // Update password if needed
      if (showPasswordSection && newPassword) {
        const passwordResponse = await fetch(`${API_BASE}/api/users/${user.id}/password`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password: newPassword }),
        });

        const passwordData = await passwordResponse.json();

        if (!passwordData.success) {
          setError(passwordData.error || 'Failed to update password');
          setIsLoading(false);
          return;
        }
      }

      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error('Update user error:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value as any })}
              disabled={isLoading}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department (Optional)</Label>
              <Input
                id="department"
                placeholder="e.g., IT, Sales, Marketing"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team">Team (Optional)</Label>
              <Input
                id="team"
                placeholder="e.g., Support Team, Dev Team"
                value={formData.team}
                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="active">Account Status</Label>
            <Select
              value={formData.active ? 'active' : 'inactive'}
              onValueChange={(value) => setFormData({ ...formData, active: value === 'active' })}
              disabled={isLoading}
            >
              <SelectTrigger id="active">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active - Can log in</SelectItem>
                <SelectItem value="inactive">Inactive - Cannot log in</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Password Change Section */}
          <div className="border-t pt-4">
            {!showPasswordSection ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordSection(true)}
                disabled={isLoading}
              >
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setNewPassword('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    className="pr-10"
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
                  Leave empty to keep current password unchanged.
                </p>
              </div>
            )}
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
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
