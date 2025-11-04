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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getApiBaseUrl } from '@/lib/api';

interface AddAgentSeatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentExtraSeats: number;
  baseLimit: number;
  currentUsage: number;
  pricePerSeat: number;
  onSuccess: () => void;
}

export function AddAgentSeatsModal({
  open,
  onOpenChange,
  currentExtraSeats,
  baseLimit,
  currentUsage,
  pricePerSeat,
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

  const handleQuantityChange = (value: string) => {
    const num = parseInt(value) || 0;
    setQuantity(Math.max(0, Math.min(50, num)));
  };

  const handleSliderChange = (value: number[]) => {
    setQuantity(value[0]);
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
      const seatWord = Math.abs(quantity - currentExtraSeats) === 1 ? 'seat' : 'seats';

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

  const monthlyPrice = quantity * pricePerSeat;
  const hasChanges = quantity !== currentExtraSeats;
  const newLimit = baseLimit + quantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Agent Seats</DialogTitle>
          <DialogDescription>
            Add or remove extra agent seats for your team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base Plan:</span>
              <span className="font-medium">{baseLimit} agents included</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Extra Seats:</span>
              <span className="font-medium">
                {currentExtraSeats} seat{currentExtraSeats !== 1 ? 's' : ''} purchased
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

          {/* Seat Selector */}
          <div className="space-y-3">
            <Label htmlFor="quantity">Extra Agent Seats</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[quantity]}
                onValueChange={handleSliderChange}
                min={0}
                max={50}
                step={1}
                className="flex-1"
              />
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="w-20"
                min={0}
                max={50}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Select 0-50 additional agent seats beyond your base plan
            </p>
          </div>

          {/* Pricing Preview */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-900 dark:text-blue-100">
                {quantity} seat{quantity !== 1 ? 's' : ''} × ${pricePerSeat.toFixed(2)}/month
              </span>
              <span className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                ${monthlyPrice.toFixed(2)}/month
              </span>
            </div>

            {hasChanges && (
              <>
                <Separator className="bg-blue-200 dark:bg-blue-800" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  {quantity > currentExtraSeats && (
                    <p>
                      Adding {quantity - currentExtraSeats} seat{quantity - currentExtraSeats !== 1 ? 's' : ''} will be prorated for the remaining billing period.
                    </p>
                  )}
                  {quantity < currentExtraSeats && (
                    <p>
                      Removing {currentExtraSeats - quantity} seat{currentExtraSeats - quantity !== 1 ? 's' : ''} will credit your account for the remaining billing period.
                    </p>
                  )}
                  {quantity === currentExtraSeats && (
                    <p>No changes to your current subscription.</p>
                  )}
                </div>
              </>
            )}

            {quantity !== currentExtraSeats && (
              <div className="pt-2">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-blue-900 dark:text-blue-100">New Limit:</span>
                  <span className="text-blue-900 dark:text-blue-100">
                    {newLimit} agents
                  </span>
                </div>
              </div>
            )}
          </div>

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
