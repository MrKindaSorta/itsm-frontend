import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
        const response = await fetch(`${API_BASE}/api/departments/unique`);
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

  // Check if current value is a custom (not in list)
  const isCustomValue = value && !departments.includes(value);

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
        <Command>
          <CommandInput
            placeholder="Search or type new department..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading departments...</CommandEmpty>
            ) : (
              <>
                {filteredDepartments.length === 0 && searchValue && (
                  <CommandGroup>
                    <CommandItem
                      value={searchValue}
                      onSelect={() => {
                        onChange(searchValue.trim());
                        setOpen(false);
                        setSearchValue('');
                      }}
                    >
                      <span className="text-muted-foreground mr-2">Create:</span>
                      <span className="font-medium">{searchValue}</span>
                    </CommandItem>
                  </CommandGroup>
                )}
                {filteredDepartments.length > 0 && (
                  <CommandGroup heading="Existing Departments">
                    {filteredDepartments.map((dept) => (
                      <CommandItem
                        key={dept}
                        value={dept}
                        onSelect={(currentValue) => {
                          onChange(currentValue === value ? '' : currentValue);
                          setOpen(false);
                          setSearchValue('');
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            value === dept ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {dept}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {searchValue && filteredDepartments.length > 0 && (
                  <CommandGroup>
                    <CommandItem
                      value={searchValue}
                      onSelect={() => {
                        onChange(searchValue.trim());
                        setOpen(false);
                        setSearchValue('');
                      }}
                    >
                      <span className="text-muted-foreground mr-2">Create:</span>
                      <span className="font-medium">{searchValue}</span>
                    </CommandItem>
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
