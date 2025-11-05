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

interface TeamComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TeamCombobox({
  value,
  onChange,
  placeholder = 'Select team...',
  disabled = false,
  className,
}: TeamComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [teams, setTeams] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchValue, setSearchValue] = React.useState('');

  // Fetch unique teams from API
  React.useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetchWithAuth(`${API_BASE}/api/teams/unique`);
        const data = await response.json();
        if (data.success) {
          setTeams(data.teams || []);
        }
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, []);

  // Filter teams based on search
  const filteredTeams = React.useMemo(() => {
    if (!searchValue) return teams;
    return teams.filter((team) =>
      team.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [teams, searchValue]);

  const handleSelect = (selectedTeam: string) => {
    onChange(selectedTeam);
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
            placeholder="Search or type new team..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="mb-2"
            autoFocus
          />

          <div className="max-h-[200px] overflow-y-auto">
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading teams...
              </div>
            ) : (
              <>
                {filteredTeams.length === 0 && searchValue && (
                  <button
                    onClick={handleCreateNew}
                    className="w-full flex items-center px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer"
                  >
                    <span className="text-muted-foreground mr-2">Create:</span>
                    <span className="font-medium">{searchValue}</span>
                  </button>
                )}

                {filteredTeams.length > 0 && (
                  <>
                    {searchValue && (
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Existing Teams
                      </div>
                    )}
                    {filteredTeams.map((team) => (
                      <button
                        key={team}
                        onClick={() => handleSelect(team)}
                        className="w-full flex items-center px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            value === team ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {team}
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

                {filteredTeams.length === 0 && !searchValue && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No teams found
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
