import { useState, useEffect, useMemo } from 'react';
import { CustomFieldValue } from './CustomFieldValue';
import { getVisibleFieldsInHierarchicalOrder } from '@/utils/conditionalFieldEvaluator';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import type { FormField } from '@/types/formBuilder';
import type { Ticket } from '@/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

interface CustomFieldsDisplayProps {
  ticket: Ticket;
  formFields?: FormField[];
  variant?: 'agent' | 'portal';
}

export function CustomFieldsDisplay({ ticket, formFields, variant = 'agent' }: CustomFieldsDisplayProps) {
  const [fields, setFields] = useState<FormField[]>(formFields || []);
  const [isLoading, setIsLoading] = useState(!formFields);

  // Fetch form configuration if not provided
  useEffect(() => {
    if (!formFields) {
      loadFormConfiguration();
    }
  }, [formFields]);

  const loadFormConfiguration = async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE}/api/config/form`);
      const data = await response.json();
      if (data.success && data.config.fields) {
        setFields(data.config.fields);
        // Cache in localStorage for future use
        localStorage.setItem('itsm-form-configuration', JSON.stringify(data.config));
      }
    } catch (error) {
      console.error('Failed to load form configuration:', error);
      // Fallback to localStorage cache
      const saved = localStorage.getItem('itsm-form-configuration');
      if (saved) {
        try {
          const config = JSON.parse(saved);
          setFields(config.fields || []);
        } catch (parseError) {
          console.error('Failed to parse cached form configuration:', parseError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get visible fields based on conditional logic
  const visibleFields = useMemo(() => {
    if (!ticket.customFields || fields.length === 0) return [];
    return getVisibleFieldsInHierarchicalOrder(fields, ticket.customFields);
  }, [fields, ticket.customFields]);

  // Filter to only fields with values (and not system fields shown elsewhere)
  const fieldsToShow = useMemo(() => {
    return visibleFields.filter(field => {
      // Skip system fields shown elsewhere
      const systemFieldsToSkip = [
        'system-priority',
        'system-category',
        'system-title',
        'system-description'
      ];
      if (systemFieldsToSkip.includes(field.id)) {
        return false;
      }

      // Skip cc_users type (has dedicated section)
      if (field.type === 'cc_users') {
        return false;
      }

      // Skip priority and category types (shown in header/details)
      if (field.type === 'priority' || field.type === 'category') {
        return false;
      }

      // Skip fields without values
      const value = ticket.customFields[field.id];
      if (value === null || value === undefined || value === '') {
        return false;
      }
      if (Array.isArray(value) && value.length === 0) {
        return false;
      }

      return true;
    });
  }, [visibleFields, ticket.customFields]);

  // Don't render section if loading or no custom fields to show
  if (isLoading || fieldsToShow.length === 0) {
    return null;
  }

  // Render based on variant (agent vs portal)
  if (variant === 'portal') {
    return (
      <>
        {fieldsToShow.map(field => (
          <div key={field.id}>
            <p className="text-muted-foreground mb-1 text-sm">{field.label}</p>
            <div className="font-medium">
              <CustomFieldValue
                field={field}
                value={ticket.customFields[field.id]}
              />
            </div>
          </div>
        ))}
      </>
    );
  }

  // Agent variant (default)
  return (
    <>
      {fieldsToShow.map(field => (
        <div key={field.id} className="flex items-start justify-between gap-2">
          <span className="text-muted-foreground text-sm">{field.label}</span>
          <div className="flex-1 min-w-0 text-right">
            <CustomFieldValue
              field={field}
              value={ticket.customFields[field.id]}
            />
          </div>
        </div>
      ))}
    </>
  );
}
