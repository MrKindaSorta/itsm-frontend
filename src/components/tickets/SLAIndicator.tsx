import type { SLAStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { getSLAStatusColor, formatDateTime } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface SLAIndicatorProps {
  sla: SLAStatus | null | undefined;
}

export function SLAIndicator({ sla }: SLAIndicatorProps) {
  // If no SLA is defined, don't render anything
  if (!sla) {
    return null;
  }

  const colorClass = getSLAStatusColor(sla.status);

  // Calculate time remaining until resolution due
  const now = new Date();
  const timeRemaining = sla.resolutionDue.getTime() - now.getTime();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  let displayText = '';

  if (sla.resolutionBreached) {
    displayText = 'Breached';
  } else if (timeRemaining < 0) {
    displayText = 'Overdue';
  } else if (hoursRemaining < 1) {
    displayText = `${minutesRemaining}m left`;
  } else if (hoursRemaining < 24) {
    displayText = `${hoursRemaining}h left`;
  } else {
    const daysRemaining = Math.floor(hoursRemaining / 24);
    displayText = `${daysRemaining}d left`;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${colorClass} flex items-center gap-1 w-fit cursor-help`}>
            <Clock className="h-3 w-3" />
            {displayText}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">SLA Resolution Due:</p>
            <p className="text-sm">{formatDateTime(sla.resolutionDue)}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
