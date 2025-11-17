import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AgentLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCount: number;
  limit: number;
  plan: string;
}

const PLAN_NAMES: Record<string, string> = {
  free: 'Free',
  paid: 'Professional',
};

const UPGRADE_SUGGESTIONS: Record<string, { nextPlan: string; nextLimit: number }> = {
  free: { nextPlan: 'Professional', nextLimit: 3 },
};

export function AgentLimitModal({
  open,
  onOpenChange,
  currentCount,
  limit,
  plan
}: AgentLimitModalProps) {
  const navigate = useNavigate();
  const planName = PLAN_NAMES[plan] || plan;
  const upgrade = UPGRADE_SUGGESTIONS[plan];

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/agent/billing');
  };

  const handleViewBilling = () => {
    onOpenChange(false);
    navigate('/agent/billing');
  };

  const percentage = Math.round((currentCount / limit) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Agent Limit Reached
          </DialogTitle>
          <DialogDescription>
            You've reached your {planName} plan limit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Current Usage</span>
              <span className="font-semibold">
                {currentCount} of {limit} agents
              </span>
            </div>
            <Progress
              value={percentage}
              className="h-3"
              indicatorClassName="bg-red-500"
            />
          </div>

          {/* Upgrade Suggestion */}
          {upgrade && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                    Upgrade to {upgrade.nextPlan}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Get up to {upgrade.nextLimit} agents and unlock additional features
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Information Box */}
          <div className="bg-muted rounded-lg p-4 text-sm space-y-2">
            <p className="font-medium">To add more agents, you can:</p>
            <ul className="space-y-1 ml-4 list-disc text-muted-foreground">
              <li>Upgrade to a higher plan for more agent slots</li>
              <li>Deactivate unused agent accounts</li>
              <li>Remove agents who no longer need access</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleViewBilling}
            className="w-full sm:w-auto"
          >
            View Billing
          </Button>
          {upgrade && (
            <Button
              onClick={handleUpgrade}
              className="w-full sm:w-auto"
            >
              Upgrade to {upgrade.nextPlan}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
