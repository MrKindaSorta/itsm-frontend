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

interface DepartmentComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DepartmentCombobox({
  value,
  onChange,
  placeholder = 'Select department...',
  disabled = false,
  className,
}: DepartmentComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [departments, setDepartments] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchValue, setSearchValue] = React.useState('');

  // Fetch unique departments from API
  React.useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetchWithAuth(`${API_BASE}/api/departments/unique`);
        const data = await response.json();
        if (data.success) {
          setDepartments(data.departments || []);
        }
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  // Filter departments based on search
  const filteredDepartments = React.useMemo(() => {
    if (!searchValue) return departments;
    return departments.filter((dept) =>
      dept.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [departments, searchValue]);

  const handleSelect = (selectedDept: string) => {
    onChange(selectedDept);
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
            placeholder="Search or type new department..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="mb-2"
            autoFocus
          />

          <div className="max-h-[200px] overflow-y-auto">
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading departments...
              </div>
            ) : (
              <>
                {filteredDepartments.length === 0 && searchValue && (
                  <button
                    onClick={handleCreateNew}
                    className="w-full flex items-center px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer"
                  >
                    <span className="text-muted-foreground mr-2">Create:</span>
                    <span className="font-medium">{searchValue}</span>
                  </button>
                )}

                {filteredDepartments.length > 0 && (
                  <>
                    {searchValue && (
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Existing Departments
                      </div>
                    )}
                    {filteredDepartments.map((dept) => (
                      <button
                        key={dept}
                        onClick={() => handleSelect(dept)}
                        className="w-full flex items-center px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            value === dept ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {dept}
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

                {filteredDepartments.length === 0 && !searchValue && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No departments found
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
