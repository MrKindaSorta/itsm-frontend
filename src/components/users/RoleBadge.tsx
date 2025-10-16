import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const getRoleStyles = (role: UserRole): string => {
    const styles: Record<UserRole, string> = {
      user: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800',
      agent: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800',
      manager: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800',
      admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800',
    };
    return styles[role] || styles.user;
  };

  const getRoleLabel = (role: UserRole): string => {
    const labels: Record<UserRole, string> = {
      user: 'User',
      agent: 'Agent',
      manager: 'Manager',
      admin: 'Admin',
    };
    return labels[role] || role;
  };

  return (
    <Badge className={cn(getRoleStyles(role), className)}>
      {getRoleLabel(role)}
    </Badge>
  );
}
