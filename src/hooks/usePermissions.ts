import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

interface PermissionMatrix {
  [key: string]: UserRole[];
}

// Define permissions matrix
const permissions: PermissionMatrix = {
  // Ticket permissions
  'ticket:create': ['user', 'agent', 'manager', 'admin'],
  'ticket:view:own': ['user', 'agent', 'manager', 'admin'],
  'ticket:view:all': ['agent', 'manager', 'admin'],
  'ticket:edit': ['agent', 'manager', 'admin'],
  'ticket:delete': ['admin'],
  'ticket:assign': ['manager', 'admin'],
  'ticket:close': ['manager', 'admin'],
  'ticket:resolve': ['agent', 'manager', 'admin'],

  // User management
  'user:view': ['agent', 'manager', 'admin'],
  'user:create': ['admin'],
  'user:edit': ['manager', 'admin'],
  'user:delete': ['admin'],

  // System settings
  'settings:view': ['manager', 'admin'],
  'settings:edit': ['admin'],

  // Customize
  'customize:view': ['manager', 'admin'],
  'customize:edit': ['admin'],

  // Reports
  'reports:view': ['agent', 'manager', 'admin'],
  'reports:export': ['manager', 'admin'],

  // Knowledge base
  'kb:view': ['user', 'agent', 'manager', 'admin'],
  'kb:create': ['agent', 'manager', 'admin'],
  'kb:edit': ['agent', 'manager', 'admin'],
  'kb:delete': ['manager', 'admin'],

  // Dashboard
  'dashboard:view': ['agent', 'manager', 'admin'],
};

export function usePermissions() {
  const { user } = useAuth();

  const can = useMemo(() => {
    return (permission: string): boolean => {
      if (!user) return false;
      const allowedRoles = permissions[permission];
      if (!allowedRoles) return false;
      return allowedRoles.includes(user.role);
    };
  }, [user]);

  const canEditTicket = useMemo(() => can('ticket:edit'), [can]);
  const canCloseTicket = useMemo(() => can('ticket:close'), [can]);
  const canManageUsers = useMemo(() => can('user:edit'), [can]);
  const canViewDashboard = useMemo(() => can('dashboard:view'), [can]);
  const canManageSettings = useMemo(() => can('settings:edit'), [can]);

  return {
    can,
    canEditTicket,
    canCloseTicket,
    canManageUsers,
    canViewDashboard,
    canManageSettings,
  };
}
