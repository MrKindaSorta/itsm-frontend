import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FormBuilderLayoutProps {
  header: React.ReactNode;
  palette: React.ReactNode;
  canvas: React.ReactNode;
  properties: React.ReactNode;
}

const STORAGE_KEY_LEFT = 'form-builder-left-collapsed';
const STORAGE_KEY_RIGHT = 'form-builder-right-collapsed';

export default function FormBuilderLayout({
  header,
  palette,
  canvas,
  properties,
}: FormBuilderLayoutProps) {
  // Load collapsed state from localStorage
  const [leftCollapsed, setLeftCollapsed] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LEFT);
    return saved === 'true';
  });

  const [rightCollapsed, setRightCollapsed] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_RIGHT);
    return saved === 'true';
  });

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LEFT, leftCollapsed.toString());
  }, [leftCollapsed]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RIGHT, rightCollapsed.toString());
  }, [rightCollapsed]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border">
        {header}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar - Field Palette */}
        <div
          className={cn(
            'flex-shrink-0 border-r border-border bg-card transition-all duration-300 ease-in-out overflow-hidden',
            leftCollapsed ? 'w-[48px]' : 'w-[280px]'
          )}
        >
          <div className={cn(
            'h-full',
            leftCollapsed && 'opacity-0 pointer-events-none'
          )}>
            {palette}
          </div>

          {/* Left Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'absolute left-0 top-1/2 -translate-y-1/2 h-20 w-6 rounded-r-md rounded-l-none border border-l-0 border-border bg-background hover:bg-accent z-10 transition-all duration-300',
              leftCollapsed ? 'translate-x-[48px]' : 'translate-x-[280px]'
            )}
            onClick={() => setLeftCollapsed(!leftCollapsed)}
            title={leftCollapsed ? 'Expand palette' : 'Collapse palette'}
          >
            {leftCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>

          {/* Collapsed Icon Strip */}
          {leftCollapsed && (
            <div className="absolute left-0 top-0 w-[48px] h-full flex flex-col items-center py-4 gap-3 overflow-y-auto">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
                onClick={() => setLeftCollapsed(false)}
                title="Expand to see field types"
              >
                <span className="text-lg">📝</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
                onClick={() => setLeftCollapsed(false)}
                title="Expand to see field types"
              >
                <span className="text-lg">▼</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
                onClick={() => setLeftCollapsed(false)}
                title="Expand to see field types"
              >
                <span className="text-lg">📅</span>
              </Button>
            </div>
          )}
        </div>

        {/* Center - Form Canvas */}
        <div className="flex-1 overflow-auto bg-muted/30">
          {canvas}
        </div>

        {/* Right Sidebar - Field Properties */}
        <div
          className={cn(
            'flex-shrink-0 border-l border-border bg-card transition-all duration-300 ease-in-out overflow-hidden',
            rightCollapsed ? 'w-[48px]' : 'w-[320px]'
          )}
        >
          <div className={cn(
            'h-full',
            rightCollapsed && 'opacity-0 pointer-events-none'
          )}>
            {properties}
          </div>

          {/* Right Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'absolute right-0 top-1/2 -translate-y-1/2 h-20 w-6 rounded-l-md rounded-r-none border border-r-0 border-border bg-background hover:bg-accent z-10 transition-all duration-300',
              rightCollapsed ? '-translate-x-[48px]' : '-translate-x-[320px]'
            )}
            onClick={() => setRightCollapsed(!rightCollapsed)}
            title={rightCollapsed ? 'Expand properties' : 'Collapse properties'}
          >
            {rightCollapsed ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          {/* Collapsed Icon Strip */}
          {rightCollapsed && (
            <div className="absolute right-0 top-0 w-[48px] h-full flex flex-col items-center py-4 gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
                onClick={() => setRightCollapsed(false)}
                title="Expand properties panel"
              >
                <span className="text-lg">⚙️</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
