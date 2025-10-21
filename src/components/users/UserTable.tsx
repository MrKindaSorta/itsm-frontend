import { useState } from 'react';
import type { User } from '@/types';
import { RoleBadge } from './RoleBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { UserCards } from './UserCards';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onToggleActive: (userId: string) => void;
  onDelete: (userId: string) => void;
}

export function UserTable({ users, onEdit, onToggleActive, onDelete }: UserTableProps) {
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const handleDelete = (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      setDeletingUserId(userId);
      onDelete(userId);
      // Reset after a delay (the parent should refetch which will clear this)
      setTimeout(() => setDeletingUserId(null), 2000);
    }
  };

  return (
    <>
      {/* Desktop: Table View */}
      <div className="hidden md:block rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-sm font-medium">User</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Department</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Team</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Last Login</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{user.email}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {user.department || <span className="text-muted-foreground italic">None</span>}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {user.team || <span className="text-muted-foreground italic">None</span>}
                  </td>
                  <td className="px-4 py-3">
                    {user.active ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200 dark:border-gray-800">
                        Inactive
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {user.lastLogin ? formatRelativeTime(new Date(user.lastLogin)) : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(user)}
                        title="Edit user"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
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
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user.id, user.name)}
                        disabled={deletingUserId === user.id}
                        title="Delete user"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>

      {/* Mobile: Card View */}
      <div className="md:hidden">
        <UserCards
          users={users}
          onEdit={onEdit}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
        />
      </div>
    </>
  );
}
