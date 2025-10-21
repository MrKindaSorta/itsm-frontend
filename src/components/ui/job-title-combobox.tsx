import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

interface JobTitleComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function JobTitleCombobox({
  value,
  onChange,
  placeholder = 'Select job title...',
  disabled = false,
  className,
}: JobTitleComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [jobTitles, setJobTitles] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchValue, setSearchValue] = React.useState('');

  // Fetch unique job titles from API
  React.useEffect(() => {
    const fetchJobTitles = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/job-titles/unique`);
        const data = await response.json();
        if (data.success) {
          setJobTitles(data.jobTitles || []);
        }
      } catch (error) {
        console.error('Failed to fetch job titles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobTitles();
  }, []);

  // Filter job titles based on search
  const filteredJobTitles = React.useMemo(() => {
    if (!searchValue) return jobTitles;
    return jobTitles.filter((jobTitle) =>
      jobTitle.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [jobTitles, searchValue]);

  const handleSelect = (selectedJobTitle: string) => {
    onChange(selectedJobTitle);
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
            placeholder="Search or type new job title..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="mb-2"
            autoFocus
          />

          <div className="max-h-[200px] overflow-y-auto">
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading job titles...
              </div>
            ) : (
              <>
                {filteredJobTitles.length === 0 && searchValue && (
                  <button
                    onClick={handleCreateNew}
                    className="w-full flex items-center px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer"
                  >
                    <span className="text-muted-foreground mr-2">Create:</span>
                    <span className="font-medium">{searchValue}</span>
                  </button>
                )}

                {filteredJobTitles.length > 0 && (
                  <>
                    {searchValue && (
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Existing Job Titles
                      </div>
                    )}
                    {filteredJobTitles.map((jobTitle) => (
                      <button
                        key={jobTitle}
                        onClick={() => handleSelect(jobTitle)}
                        className="w-full flex items-center px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            value === jobTitle ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {jobTitle}
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

                {filteredJobTitles.length === 0 && !searchValue && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No job titles found
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
