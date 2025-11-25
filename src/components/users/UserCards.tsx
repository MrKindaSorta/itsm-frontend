import type { User } from '@/types';
import { RoleBadge } from './RoleBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, ToggleLeft, ToggleRight, Trash2, Mail, Briefcase, Clock, Lock, Unlock } from 'lucide-react';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { useState } from 'react';

interface UserCardsProps {
  users: User[];
  onEdit: (user: User) => void;
  onToggleActive: (userId: string) => void;
  onDelete: (userId: string) => void;
  onUnlock?: (userId: string, userName: string) => void;
}

export function UserCards({ users, onEdit, onToggleActive, onDelete, onUnlock }: UserCardsProps) {
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const handleDelete = (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      setDeletingUserId(userId);
      onDelete(userId);
      // Reset after a delay (the parent should refetch which will clear this)
      setTimeout(() => setDeletingUserId(null), 2000);
    }
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No users found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div
          key={user.id}
          className="p-4 border rounded-lg bg-card"
        >
          {/* Header: Avatar + Name + Actions */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                {getInitials(user.name)}
              </div>
              <div>
                <p className="text-base font-semibold">{user.name}</p>
                <p className="text-xs text-muted-foreground">ID: {user.id}</p>
              </div>
            </div>
          </div>

          {/* Role & Status */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <RoleBadge role={user.role} />
            {user.account_locked ? (
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800 inline-flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Locked
              </Badge>
            ) : user.active ? (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
                Active
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200 dark:border-gray-800">
                Inactive
              </Badge>
            )}
          </div>

          {/* Metadata */}
          <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-4">
            {/* Email */}
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="truncate">{user.email}</span>
            </div>

            {/* Department */}
            {user.department && (
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span>{user.department}</span>
                {user.team && <span className="text-muted-foreground">• {user.team}</span>}
              </div>
            )}

            {/* Last Login */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                <span className="font-medium">Last login:</span>{' '}
                {user.lastLogin ? formatRelativeTime(new Date(user.lastLogin)) : 'Never'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-3 border-t">
            {user.account_locked && onUnlock && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUnlock(user.id, user.name)}
                title="Unlock user account"
                className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950"
              >
                <Unlock className="h-4 w-4 mr-1" />
                Unlock
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(user)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleActive(user.id)}
              title={user.active ? 'Deactivate user' : 'Activate user'}
            >
              {user.active ? (
                <ToggleRight className="h-4 w-4 text-green-600" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-gray-400" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(user.id, user.name)}
              disabled={deletingUserId === user.id}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
