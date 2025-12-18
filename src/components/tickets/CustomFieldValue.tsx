import { useState } from 'react';
import { CheckCircle2, XCircle, Paperclip, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import type { FormField } from '@/types/formBuilder';

interface CustomFieldValueProps {
  field: FormField;
  value: any;
}

export function CustomFieldValue({ field, value }: CustomFieldValueProps) {
  // Skip system fields that are shown elsewhere
  const systemFieldsToSkip = ['system-priority', 'system-category', 'system-title', 'system-description'];
  if (systemFieldsToSkip.includes(field.id)) {
    return null;
  }

  // Skip cc_users type (shown in dedicated CC Users section)
  if (field.type === 'cc_users') {
    return null;
  }

  // Skip priority and category types if they're standalone custom fields
  if (field.type === 'priority' || field.type === 'category') {
    return null;
  }

  // Empty value check
  if (value === null || value === undefined || value === '') return null;
  if (Array.isArray(value) && value.length === 0) return null;

  // Type-specific rendering
  switch (field.type) {
    case 'text':
      return <TextFieldValue value={value} />;
    case 'textarea':
      return <TextareaFieldValue value={value} />;
    case 'number':
      return <NumberFieldValue value={value} />;
    case 'date':
      return <DateFieldValue value={value} />;
    case 'dropdown':
      return <DropdownFieldValue value={value} />;
    case 'multiselect':
      return <MultiselectFieldValue value={value} />;
    case 'checkbox':
      return <CheckboxFieldValue value={value} />;
    case 'file':
      return <FileFieldValue value={value} />;
    default:
      return <span className="font-medium text-sm">{String(value)}</span>;
  }
}

// Text field: Plain text with truncation
function TextFieldValue({ value }: { value: string }) {
  const maxLength = 100;
  const displayValue = value.length > maxLength ? `${value.substring(0, maxLength)}...` : value;

  return (
    <span className="font-medium text-sm break-words" title={value.length > maxLength ? value : undefined}>
      {displayValue}
    </span>
  );
}

// Textarea field: Multi-line text with "Show more" toggle
function TextareaFieldValue({ value }: { value: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 200;
  const needsTruncation = value.length > maxLength;
  const displayValue = !isExpanded && needsTruncation ? value.substring(0, maxLength) : value;

  return (
    <div className="space-y-1">
      <p className="font-medium text-sm leading-relaxed whitespace-pre-wrap break-words">
        {displayValue}
        {!isExpanded && needsTruncation && '...'}
      </p>
      {needsTruncation && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Show more
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// Number field: Formatted with thousands separator
function NumberFieldValue({ value }: { value: number | string }) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return <span className="font-medium text-sm">{String(value)}</span>;
  }

  const formatted = new Intl.NumberFormat('en-US').format(numValue);

  return <span className="font-mono font-medium text-sm">{formatted}</span>;
}

// Date field: Formatted using utility
function DateFieldValue({ value }: { value: string }) {
  try {
    return <span className="font-medium text-sm">{formatDate(value)}</span>;
  } catch (error) {
    return <span className="font-medium text-sm">{value}</span>;
  }
}

// Dropdown field: Single badge
function DropdownFieldValue({ value }: { value: string }) {
  return (
    <Badge variant="outline" className="text-xs font-normal">
      {value}
    </Badge>
  );
}

// Multiselect field: Multiple badges
function MultiselectFieldValue({ value }: { value: string[] }) {
  if (!Array.isArray(value)) {
    return <Badge variant="secondary" className="text-xs h-5 px-2">{String(value)}</Badge>;
  }

  return (
    <div className="flex flex-wrap gap-1 justify-end">
      {value.map((item, index) => (
        <Badge key={`${item}-${index}`} variant="secondary" className="text-xs h-5 px-2">
          {item}
        </Badge>
      ))}
    </div>
  );
}

// Checkbox field: Icon with Yes/No text
function CheckboxFieldValue({ value }: { value: boolean | string | number }) {
  // Coerce to boolean - handle various checkbox value formats
  const boolValue = !!(value && value !== 'false' && value !== '0' && value !== 0);

  if (boolValue) {
    return (
      <span className="flex items-center gap-1 text-green-600 font-medium text-sm">
        <CheckCircle2 className="h-4 w-4" />
        Yes
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-muted-foreground text-sm">
      <XCircle className="h-4 w-4" />
      No
    </span>
  );
}

// File field: List of filenames with download links
function FileFieldValue({ value }: { value: any }) {
  // Handle different possible value formats
  let files: Array<{ name: string; url?: string }> = [];

  if (Array.isArray(value)) {
    files = value.map(item => {
      if (typeof item === 'string') {
        return { name: item };
      }
      if (item && typeof item === 'object') {
        return {
          name: item.name || item.filename || 'Unknown file',
          url: item.url || item.downloadUrl
        };
      }
      return { name: String(item) };
    });
  } else if (typeof value === 'string') {
    files = [{ name: value }];
  } else if (value && typeof value === 'object') {
    files = [{
      name: value.name || value.filename || 'Unknown file',
      url: value.url || value.downloadUrl
    }];
  }

  if (files.length === 0) return null;

  return (
    <div className="space-y-1">
      {files.map((file, index) => (
        <div key={index} className="flex items-center gap-1 text-sm">
          {file.url ? (
            <a
              href={file.url}
              className="flex items-center gap-1 text-blue-600 hover:underline font-medium"
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              <Paperclip className="h-3 w-3" />
              {file.name}
            </a>
          ) : (
            <span className="flex items-center gap-1 text-muted-foreground">
              <FileText className="h-3 w-3" />
              {file.name}
              <span className="text-xs italic">(Not available for download)</span>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
