import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Search, Loader2 } from 'lucide-react';
import { UserTable } from '@/components/users/UserTable';
import { UserCreateModal } from '@/components/users/UserCreateModal';
import { UserEditModal } from '@/components/users/UserEditModal';
import type { User } from '@/types';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

export default function Users() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
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
      });

      const data = await response.json();

      if (data.success) {
        // Refresh users list
        fetchUsers();
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-2">Manage users and agents</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

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
          <div className="flex items-center justify-between">
            <CardTitle>All Users ({filteredUsers.length})</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
          ) : (
            <UserTable
              users={filteredUsers}
              onEdit={handleEdit}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
