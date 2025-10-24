import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getApiBaseUrl } from '@/lib/api';

interface AgentUsageData {
  currentCount: number;
  limit: number;
  plan: string;
  overageEnabled: boolean;
  overageCount: number;
  overageCost: number;
  breakdown?: {
    agents: number;
    managers: number;
    admins: number;
  };
  percentage: number;
}

interface AgentUsageWidgetProps {
  variant?: 'compact' | 'full';
  className?: string;
  onUsageUpdate?: (data: AgentUsageData) => void;
  refreshTrigger?: number;
}

export function AgentUsageWidget({
  variant = 'full',
  className = '',
  onUsageUpdate,
  refreshTrigger
}: AgentUsageWidgetProps) {
  const [usageData, setUsageData] = useState<AgentUsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsageData();
  }, [refreshTrigger]);

  const fetchUsageData = async () => {
    try {
      const API_BASE = getApiBaseUrl();
      const response = await fetch(`${API_BASE}/api/billing/agent-usage`);
      const data = await response.json();

      if (data.success) {
        setUsageData(data);
        if (onUsageUpdate) {
          onUsageUpdate(data);
        }
      } else {
        setError(data.error || 'Failed to fetch usage data');
      }
    } catch (err) {
      console.error('Error fetching agent usage:', err);
      setError('Unable to fetch usage data');
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressColor = () => {
    if (!usageData) return 'bg-gray-500';
    if (usageData.percentage >= 100) return 'bg-red-500';
    if (usageData.percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (!usageData) return null;
    if (usageData.percentage >= 100) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (usageData.percentage >= 80) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    return null;
  };

  const getPlanName = (plan: string) => {
    const names: Record<string, string> = {
      'starter': 'Starter',
      'professional': 'Professional',
      'business': 'Business',
    };
    return names[plan] || plan;
  };

  if (isLoading) {
    return (
      <div className={`${variant === 'compact' ? 'p-2' : 'p-4'} ${className}`}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4 animate-pulse" />
          <span>Loading usage...</span>
        </div>
      </div>
    );
  }

  if (error || !usageData) {
    return (
      <div className={`${variant === 'compact' ? 'p-2' : 'p-4'} ${className}`}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span className="text-xs">Usage unavailable</span>
        </div>
      </div>
    );
  }

  // Compact variant for page headers
  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center gap-3 px-4 py-2 rounded-lg border bg-card ${className} cursor-pointer hover:bg-muted/50 transition-colors`}
        onClick={() => navigate('/agent/billing')}
      >
        {getStatusIcon()}
        <Users className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-col gap-1 min-w-[120px]">
          <div className="text-xs font-medium">
            {usageData.currentCount}/{usageData.limit} agents
          </div>
          <Progress
            value={usageData.percentage}
            className="h-1.5"
            indicatorClassName={getProgressColor()}
          />
        </div>
        {usageData.percentage >= 100 && (
          <Badge variant="destructive" className="text-xs">At Limit</Badge>
        )}
        {usageData.overageCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            +{usageData.overageCount} overage
          </Badge>
        )}
      </div>
    );
  }

  // Full variant for Billing page
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Agent Usage
        </CardTitle>
        <CardDescription>
          {getPlanName(usageData.plan)} plan • {usageData.limit} agents included
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current Usage</span>
            <span className="font-semibold">
              {usageData.currentCount} of {usageData.limit}
            </span>
          </div>
          <Progress
            value={usageData.percentage}
            className="h-3"
            indicatorClassName={getProgressColor()}
          />
          <div className="text-xs text-muted-foreground text-right">
            {usageData.percentage}% utilized
          </div>
        </div>

        {/* Breakdown by Role */}
        {usageData.breakdown && (
          <div className="space-y-2 pt-2 border-t">
            <div className="text-sm font-medium">Breakdown</div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Agents</span>
                <span className="font-semibold">{usageData.breakdown.agents}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Managers</span>
                <span className="font-semibold">{usageData.breakdown.managers}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Admins</span>
                <span className="font-semibold">{usageData.breakdown.admins}</span>
              </div>
            </div>
          </div>
        )}

        {/* Overage Information (Business Tier) */}
        {usageData.overageEnabled && usageData.overageCount > 0 && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Overage Billing Active
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  {usageData.overageCount} additional agent{usageData.overageCount > 1 ? 's' : ''} × $
                  {(usageData.overageCost / usageData.overageCount).toFixed(2)} = $
                  {usageData.overageCost.toFixed(2)}/month
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warning for at/over limit */}
        {usageData.percentage >= 100 && !usageData.overageEnabled && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-900 dark:text-red-100">
                  Agent Limit Reached
                </p>
                <p className="text-red-700 dark:text-red-300 mt-1">
                  You cannot add more agents without upgrading your plan.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/agent/users')}
            className="w-full"
          >
            Manage Users
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Export a refresh function for external use
export function useAgentUsageRefresh() {
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return { refreshKey, refresh };
}
