import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

interface ManagerComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ManagerCombobox({
  value,
  onChange,
  placeholder = 'Select manager...',
  disabled = false,
  className,
}: ManagerComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [managers, setManagers] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchValue, setSearchValue] = React.useState('');

  // Fetch unique managers from API (includes both free-text values and users with manager role)
  React.useEffect(() => {
    const fetchManagers = async () => {
      try {
        const response = await fetchWithAuth(`${API_BASE}/api/managers/unique`);
        const data = await response.json();
        if (data.success) {
          setManagers(data.managers || []);
        }
      } catch (error) {
        console.error('Failed to fetch managers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchManagers();
  }, []);

  // Filter managers based on search
  const filteredManagers = React.useMemo(() => {
    if (!searchValue) return managers;
    return managers.filter((manager) =>
      manager.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [managers, searchValue]);

  const handleSelect = (selectedManager: string) => {
    onChange(selectedManager);
    setOpen(false);
    setSearchValue('');
  };

  const handleCreateNew = () => {
    if (searchValue.trim()) {
      onChange(searchValue.trim());
      setOpen(false);
      setSearchValue('');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between', className)}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="p-2">
          <Input
            placeholder="Search or type new manager..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="mb-2"
            autoFocus
          />

          <div className="max-h-[200px] overflow-y-auto">
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading managers...
              </div>
            ) : (
              <>
                {filteredManagers.length === 0 && searchValue && (
                  <button
                    onClick={handleCreateNew}
                    className="w-full flex items-center px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer"
                  >
                    <span className="text-muted-foreground mr-2">Create:</span>
                    <span className="font-medium">{searchValue}</span>
                  </button>
                )}

                {filteredManagers.length > 0 && (
                  <>
                    {searchValue && (
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Existing Managers
                      </div>
                    )}
                    {filteredManagers.map((manager) => (
                      <button
                        key={manager}
                        onClick={() => handleSelect(manager)}
                        className="w-full flex items-center px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            value === manager ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {manager}
                      </button>
                    ))}

                    {searchValue && (
                      <>
                        <div className="border-t my-1" />
                        <button
                          onClick={handleCreateNew}
                          className="w-full flex items-center px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer"
                        >
                          <span className="text-muted-foreground mr-2">Create:</span>
                          <span className="font-medium">{searchValue}</span>
                        </button>
                      </>
                    )}
                  </>
                )}

                {filteredManagers.length === 0 && !searchValue && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No managers found
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
