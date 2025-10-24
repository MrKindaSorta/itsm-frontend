import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';
import { startVersionCheck, stopVersionCheck, reloadApp } from '@/utils/versionCheck';

export function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  useEffect(() => {
    // Start checking for updates
    startVersionCheck(() => {
      setShowUpdate(true);
    });

    // Cleanup on unmount
    return () => {
      stopVersionCheck();
    };
  }, []);

  const handleUpdate = async () => {
    setIsReloading(true);
    await reloadApp();
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-primary text-primary-foreground shadow-lg rounded-lg p-4 max-w-sm flex items-center gap-3">
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">Update Available</h4>
          <p className="text-xs opacity-90">
            A new version of the app is available. Click to refresh and get the latest updates.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleUpdate}
            disabled={isReloading}
            className="whitespace-nowrap"
          >
            {isReloading ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            disabled={isReloading}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
