import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Save,
  Eye,
  MoreHorizontal,
  HelpCircle,
  Settings,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Download,
  Upload,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface FormBuilderHeaderProps {
  formName: string;
  onFormNameChange: (name: string) => void;
  onSave: () => void | Promise<void>;
  onPreview: () => void;
  onReset: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onShowShortcuts?: () => void;
  onSettings?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  saveStatus?: 'saved' | 'saving' | 'error' | 'unsaved';
}

export default function FormBuilderHeader({
  formName,
  onFormNameChange,
  onSave,
  onPreview,
  onReset,
  onUndo,
  onRedo,
  onExport,
  onImport,
  onShowShortcuts,
  onSettings,
  canUndo = false,
  canRedo = false,
  saveStatus = 'saved',
}: FormBuilderHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(formName);

  useEffect(() => {
    setTempName(formName);
  }, [formName]);

  const handleNameSave = () => {
    if (tempName.trim() && tempName !== formName) {
      onFormNameChange(tempName.trim());
    } else {
      setTempName(formName);
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setTempName(formName);
      setIsEditingName(false);
    }
  };

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-background">
      {/* Left Section - Breadcrumb & Form Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Customize</span>
          <span>/</span>
          <span>Form Builder</span>
        </div>

        <span className="text-muted-foreground">•</span>

        {isEditingName ? (
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={handleNameKeyDown}
            className="px-2 py-1 text-sm font-medium border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
            style={{ width: `${Math.max(tempName.length, 10)}ch` }}
          />
        ) : (
          <button
            onClick={() => setIsEditingName(true)}
            className="px-2 py-1 text-sm font-medium hover:bg-accent rounded transition-colors"
            title="Click to edit form name"
          >
            {formName}
          </button>
        )}
      </div>

      {/* Center Section - Undo/Redo */}
      {(onUndo || onRedo) && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Undo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
          >
            <ArrowRight className="h-4 w-4 mr-1" />
            Redo
          </Button>
        </div>
      )}

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        {/* Save Status Indicator */}
        <div className="flex items-center gap-2 text-sm">
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-green-600">
              <Check className="h-4 w-4" />
              Saved
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1 text-destructive">
              <AlertCircle className="h-4 w-4" />
              Error saving
            </span>
          )}
          {saveStatus === 'unsaved' && (
            <span className="flex items-center gap-1 text-orange-600">
              Unsaved changes
            </span>
          )}
        </div>

        {/* Preview Button */}
        <Button variant="outline" size="sm" onClick={onPreview}>
          <Eye className="h-4 w-4 mr-1" />
          Preview
        </Button>

        {/* Save Button */}
        <Button
          size="sm"
          onClick={onSave}
          disabled={saveStatus === 'saving'}
          className={cn(
            saveStatus === 'error' && 'bg-destructive hover:bg-destructive/90'
          )}
        >
          <Save className="h-4 w-4 mr-1" />
          {saveStatus === 'error' ? 'Retry Save' : 'Save'}
        </Button>

        {/* More Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {onExport && (
              <DropdownMenuItem onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Export Configuration
              </DropdownMenuItem>
            )}
            {onImport && (
              <DropdownMenuItem onClick={onImport}>
                <Upload className="h-4 w-4 mr-2" />
                Import Configuration
              </DropdownMenuItem>
            )}
            {(onExport || onImport) && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={onReset} className="text-destructive">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Form
            </DropdownMenuItem>
            {onSettings && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  Form Settings
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help/Shortcuts Button */}
        {onShowShortcuts && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onShowShortcuts}
            title="Keyboard Shortcuts (Ctrl+/)"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
