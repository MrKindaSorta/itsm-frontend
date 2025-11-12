import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { User } from '@/types';
import { getInitials } from '@/lib/utils';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { usersCache } from '@/lib/usersCache';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

interface InlineAssigneeSelectProps {
  assignee?: User;
  onAssigneeChange: (newAssigneeId: string | null) => Promise<void>;
  disabled?: boolean;
}

export function InlineAssigneeSelect({ assignee, onAssigneeChange, disabled }: InlineAssigneeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch users when popover opens (check cache first)
  useEffect(() => {
    if (isOpen && users.length === 0) {
      // Try cache first
      const cachedUsers = usersCache.get();
      if (cachedUsers) {
        // Filter to only show agents, managers, and admins
        const eligibleUsers = cachedUsers.filter((u: User) =>
          ['agent', 'manager', 'admin'].includes(u.role)
        );
        setUsers(eligibleUsers);
      } else {
        // Cache miss - fetch from API
        fetchUsers();
      }
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetchWithAuth(`${API_BASE}/api/users`);
      const data = await response.json();
      if (data.success) {
        // Save to cache for future use
        usersCache.set(data.users);

        // Filter to only show agents, managers, and admins
        const eligibleUsers = data.users.filter((u: User) =>
          ['agent', 'manager', 'admin'].includes(u.role)
        );
        setUsers(eligibleUsers);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleSelect = (userId: string | null) => {
    if (userId === (assignee?.id ?? null)) {
      setIsOpen(false);
      return;
    }

    // Close popover immediately (optimistic UI)
    setIsOpen(false);

    // Fire the update in the background
    onAssigneeChange(userId).catch((error) => {
      console.error('Failed to update assignee:', error);
      // Error handling is done by the mutation hook (shows toast)
    });
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className="inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-2 py-1 hover:bg-accent transition-colors"
          onClick={(e) => {
            e.stopPropagation(); // Prevent row click
          }}
        >
          {assignee ? (
            <>
              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
                {getInitials(assignee.name)}
              </div>
              <span className="text-sm">{assignee.name}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground italic">Unassigned</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-2">
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium text-muted-foreground mb-2">Assign To</p>
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1">
            {/* Unassigned option */}
            <button
              onClick={() => handleSelect(null)}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent transition-colors text-left"
            >
              <div className="flex-shrink-0">
                {!assignee ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <div className="h-4 w-4" />
                )}
              </div>
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                <X className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm italic text-muted-foreground">Unassigned</p>
              </div>
            </button>

            {/* User list */}
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {searchQuery ? 'No users found' : 'No available users'}
              </p>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelect(String(user.id))}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent transition-colors text-left"
                >
                  <div className="flex-shrink-0">
                    {assignee?.id === user.id ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <div className="h-4 w-4" />
                    )}
                  </div>
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
                    {getInitials(user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
