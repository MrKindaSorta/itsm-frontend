import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Search, Loader2, Trash2, RotateCcw } from 'lucide-react';
import { UserTable } from '@/components/users/UserTable';
import { UserCreateModal } from '@/components/users/UserCreateModal';
import { UserEditModal } from '@/components/users/UserEditModal';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

type ViewMode = 'active' | 'deleted';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
    fetchDeletedUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/users`);
      const data = await response.json();

      if (data.success) {
        // Transform data to match User interface
        const transformedUsers = data.users.map((user: any) => ({
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          team: user.team,
          active: user.active === 1,
          notificationPreferences: {},
          createdAt: user.created_at ? new Date(user.created_at) : undefined,
          lastLogin: user.last_login ? new Date(user.last_login) : undefined,
          phone: user.phone,
          mobile_phone: user.mobile_phone,
          location: user.location,
          job_title: user.job_title,
          manager: user.manager,
          deleted_at: user.deleted_at,
          permanently_deleted: user.permanently_deleted,
          isDeleted: user.isDeleted,
        }));
        setUsers(transformedUsers);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeletedUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users?deleted_only=true`);
      const data = await response.json();

      if (data.success) {
        const transformedUsers = data.users.map((user: any) => ({
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          team: user.team,
          active: user.active === 1,
          notificationPreferences: {},
          createdAt: user.created_at ? new Date(user.created_at) : undefined,
          lastLogin: user.last_login ? new Date(user.last_login) : undefined,
          phone: user.phone,
          mobile_phone: user.mobile_phone,
          location: user.location,
          job_title: user.job_title,
          manager: user.manager,
          deleted_at: user.deleted_at,
          permanently_deleted: user.permanently_deleted,
          isDeleted: user.isDeleted,
        }));
        setDeletedUsers(transformedUsers);
      }
    } catch (err) {
      console.error('Error fetching deleted users:', err);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleToggleActive = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Refresh users list
        fetchUsers();
      } else {
        alert(data.error || 'Failed to toggle user status');
      }
    } catch (err) {
      console.error('Error toggling user status:', err);
      alert('Failed to connect to server');
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requesting_user_id: currentUser?.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh both lists
        fetchUsers();
        fetchDeletedUsers();
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to connect to server');
    }
  };

  const handleRestore = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Refresh both lists
        fetchUsers();
        fetchDeletedUsers();
      } else {
        alert(data.error || 'Failed to restore user');
      }
    } catch (err) {
      console.error('Error restoring user:', err);
      alert('Failed to connect to server');
    }
  };

  const handlePermanentDelete = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Are you sure you want to PERMANENTLY delete user "${userName}"?\n\n` +
        `This will:\n` +
        `- Remove their login access forever\n` +
        `- Strip all sensitive data (email, password)\n` +
        `- Keep their name for ticket history\n\n` +
        `This action CANNOT be undone!`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}/permanent`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requesting_user_id: currentUser?.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh deleted users list
        fetchDeletedUsers();
      } else {
        alert(data.error || 'Failed to permanently delete user');
      }
    } catch (err) {
      console.error('Error permanently deleting user:', err);
      alert('Failed to connect to server');
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower) ||
      (user.department && user.department.toLowerCase().includes(searchLower)) ||
      (user.team && user.team.toLowerCase().includes(searchLower))
    );
  });

  const filteredDeletedUsers = deletedUsers.filter((user) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower) ||
      (user.department && user.department.toLowerCase().includes(searchLower)) ||
      (user.team && user.team.toLowerCase().includes(searchLower))
    );
  });

  const renderDeletedUserTable = () => (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-sm font-medium">User</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Department</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Deleted At</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeletedUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No deleted users found
                </td>
              </tr>
            ) : (
              filteredDeletedUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3 text-sm">{user.role}</td>
                  <td className="px-4 py-3 text-sm">{user.department || '-'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {user.deleted_at ? new Date(user.deleted_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(user.id)}
                        title="Restore user"
                      >
                        <RotateCcw className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Restore</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handlePermanentDelete(user.id, user.name)}
                        title="Permanently delete user"
                      >
                        <Trash2 className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Delete</span>
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
  );

  return (
    <div className="space-y-6">
      <UserCreateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={fetchUsers}
      />

      <UserEditModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={fetchUsers}
        user={selectedUser}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            {/* Title Section */}
            <div>
              <CardTitle className="text-xl">Users</CardTitle>
              <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
                Manage users and agents
              </p>
            </div>

            {/* Actions - Mobile: Stack, Desktop: Horizontal */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Search - Full width on mobile */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Add User button */}
              <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
                <UserPlus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add User</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Tabs for Active/Deleted Users */}
        <div className="border-b px-6">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-full">
            <TabsList>
              <TabsTrigger value="active">Active Users ({filteredUsers.length})</TabsTrigger>
              <TabsTrigger value="deleted">Deleted Users ({filteredDeletedUsers.length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading users...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchUsers} variant="outline">
                Retry
              </Button>
            </div>
          ) : viewMode === 'active' ? (
            <UserTable
              users={filteredUsers}
              onEdit={handleEdit}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
            />
          ) : (
            renderDeletedUserTable()
          )}
        </CardContent>
      </Card>
    </div>
  );
}
