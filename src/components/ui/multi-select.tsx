import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X, ChevronDown, List } from 'lucide-react';

interface MultiSelectProps {
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MultiSelect({
  options,
  selectedValues,
  onChange,
  placeholder = 'Select options...',
  disabled = false,
  className = '',
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter options by search query
  const filteredOptions = options.filter(option => {
    if (!searchQuery) return true;
    return option.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter(v => v !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  const removeOption = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter(v => v !== option));
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <div
        className={`
          min-h-[2.5rem] w-full rounded-md border border-input bg-background px-3 py-2
          text-sm ring-offset-background cursor-pointer
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center flex-wrap gap-1.5">
          {selectedValues.length === 0 ? (
            <span className="text-muted-foreground flex items-center gap-2">
              <List className="h-4 w-4" />
              {placeholder}
            </span>
          ) : (
            selectedValues.map(value => (
              <Badge key={value} variant="secondary" className="gap-1">
                {value}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => removeOption(value, e)}
                    className="ml-1 rounded-full hover:bg-muted-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))
          )}
          <ChevronDown
            className={`h-4 w-4 ml-auto flex-shrink-0 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover border rounded-md shadow-lg max-h-[300px] overflow-hidden flex flex-col">
          {/* Search */}
          {options.length > 5 && (
            <div className="p-2 border-b">
              <Input
                placeholder="Search options..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8"
                autoFocus
              />
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No options found
              </div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = selectedValues.includes(option);
                return (
                  <div
                    key={option}
                    className={`
                      flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent
                      ${isSelected ? 'bg-accent/50' : ''}
                    `}
                    onClick={() => toggleOption(option)}
                  >
                    {/* Checkbox */}
                    <div
                      className={`
                        h-4 w-4 rounded border flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'bg-primary border-primary' : 'border-input'}
                      `}
                    >
                      {isSelected && (
                        <svg
                          className="h-3 w-3 text-primary-foreground"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>

                    {/* Option Label */}
                    <span className="text-sm flex-1">{option}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with count */}
          {selectedValues.length > 0 && (
            <div className="border-t px-3 py-2 text-xs text-muted-foreground">
              {selectedValues.length} option{selectedValues.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>
      )}
    </div>
  );
}
