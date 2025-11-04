import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getApiBaseUrl } from '@/lib/api';

interface AddAgentSeatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentExtraSeats: number;
  baseLimit: number;
  currentUsage: number;
  pricePerSeat: number;
  basePlanPrice: number;
  onSuccess: () => void;
}

export function AddAgentSeatsModal({
  open,
  onOpenChange,
  currentExtraSeats,
  baseLimit,
  currentUsage,
  pricePerSeat,
  basePlanPrice,
  onSuccess,
}: AddAgentSeatsModalProps) {
  const [quantity, setQuantity] = useState(currentExtraSeats);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Reset quantity when modal opens
  useEffect(() => {
    if (open) {
      setQuantity(currentExtraSeats);
      setError(null);
    }
  }, [open, currentExtraSeats]);

  const handleIncrement = () => {
    if (quantity < 50) {
      setQuantity(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      setQuantity(quantity - 1);
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const API_BASE = getApiBaseUrl();
      const response = await fetch(`${API_BASE}/api/billing/manage-agent-seats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update extra seats');
      }

      // Show success message
      const action = quantity > currentExtraSeats ? 'added' : quantity < currentExtraSeats ? 'removed' : 'updated';

      toast({
        title: 'Success!',
        description: `Extra agent seats ${action}. Your new limit is ${result.newLimit} agents.`,
      });

      // Close modal and refresh parent data
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while updating seats';
      setError(errorMessage);

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extraSeatsCost = quantity * pricePerSeat;
  const totalMonthlyPrice = basePlanPrice + extraSeatsCost;
  const hasChanges = quantity !== currentExtraSeats;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Agent Seats</DialogTitle>
          <DialogDescription>
            Add or remove extra agent seats for your team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Current Status */}
          <div className="bg-muted rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base Plan:</span>
              <span className="font-medium">{baseLimit} agents included</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Additional Seats Purchased:</span>
              <span className="font-medium">
                {currentExtraSeats} seat{currentExtraSeats !== 1 ? 's' : ''}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Usage:</span>
              <span className="font-semibold">
                {currentUsage} / {baseLimit + currentExtraSeats} agents
              </span>
            </div>
          </div>

          {/* Seat Selector with Plus/Minus Buttons */}
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handleDecrement}
                disabled={quantity === 0}
                className="h-10 w-10"
              >
                <Minus className="h-5 w-5" />
              </Button>

              <div className="text-center min-w-[100px]">
                <div className="text-4xl font-bold">{quantity}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Additional Agent Seats
                </div>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleIncrement}
                disabled={quantity === 50}
                className="h-10 w-10"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Add up to 50 additional seats (0-50 range)
            </p>
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-muted rounded-lg p-4 space-y-3">
            {/* Base Plan Price */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Business Plan (Base)</span>
              <span className="font-medium">${basePlanPrice.toFixed(2)}/month</span>
            </div>

            {/* Additional Seats Calculation */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {quantity} Additional Seat{quantity !== 1 ? 's' : ''} × ${pricePerSeat.toFixed(2)}
              </span>
              <span className="font-medium">${extraSeatsCost.toFixed(2)}/month</span>
            </div>

            <Separator />

            {/* New Total */}
            <div className="flex justify-between items-center">
              <span className="font-semibold text-base">New Monthly Total</span>
              <span className="font-bold text-xl">${totalMonthlyPrice.toFixed(2)}/mo</span>
            </div>
          </div>

          {/* Proration Notice */}
          {hasChanges && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {quantity > currentExtraSeats && (
                  <>
                    Adding {quantity - currentExtraSeats} seat{quantity - currentExtraSeats !== 1 ? 's' : ''} will be prorated for the remaining billing period.
                  </>
                )}
                {quantity < currentExtraSeats && (
                  <>
                    Removing {currentExtraSeats - quantity} seat{currentExtraSeats - quantity !== 1 ? 's' : ''} will credit your account for the remaining billing period.
                  </>
                )}
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !hasChanges}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
