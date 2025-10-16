import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X, ChevronDown, Users } from 'lucide-react';
import type { User } from '@/types';

interface UserMultiSelectProps {
  users: User[];
  selectedUserIds: string[];
  onChange: (userIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function UserMultiSelect({
  users,
  selectedUserIds,
  onChange,
  placeholder = 'Select users...',
  disabled = false,
  className = '',
}: UserMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Get selected users
  const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));

  // Filter users by search query
  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter(id => id !== userId));
    } else {
      onChange([...selectedUserIds, userId]);
    }
  };

  const removeUser = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedUserIds.filter(id => id !== userId));
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <div
        className={`
          min-h-[2.5rem] w-full rounded-md border border-input bg-background px-3 py-2
          text-sm ring-offset-background cursor-pointer
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center flex-wrap gap-1.5">
          {selectedUsers.length === 0 ? (
            <span className="text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              {placeholder}
            </span>
          ) : (
            selectedUsers.map(user => (
              <Badge key={user.id} variant="secondary" className="gap-1">
                {user.name}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => removeUser(user.id, e)}
                    className="ml-1 rounded-full hover:bg-muted-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))
          )}
          <ChevronDown
            className={`h-4 w-4 ml-auto flex-shrink-0 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover border rounded-md shadow-lg max-h-[300px] overflow-hidden flex flex-col">
          {/* Search */}
          <div className="p-2 border-b">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8"
              autoFocus
            />
          </div>

          {/* User List */}
          <div className="overflow-y-auto flex-1">
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No users found
              </div>
            ) : (
              filteredUsers.map(user => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    className={`
                      flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent
                      ${isSelected ? 'bg-accent/50' : ''}
                    `}
                    onClick={() => toggleUser(user.id)}
                  >
                    {/* Checkbox */}
                    <div
                      className={`
                        h-4 w-4 rounded border flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'bg-primary border-primary' : 'border-input'}
                      `}
                    >
                      {isSelected && (
                        <svg
                          className="h-3 w-3 text-primary-foreground"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>

                    {/* Role Badge */}
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {user.role}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with count */}
          {selectedUsers.length > 0 && (
            <div className="border-t px-3 py-2 text-xs text-muted-foreground">
              {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>
      )}
    </div>
  );
}
