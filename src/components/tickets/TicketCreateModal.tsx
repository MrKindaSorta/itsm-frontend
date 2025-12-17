import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { DynamicTicketForm } from './DynamicTicketForm';
import type { FormField } from '@/types/formBuilder';
import type { User } from '@/types';
import { mergeWithDefaults } from '@/utils/defaultFormConfig';
import { getFieldsToHide, evaluateFieldVisibility } from '@/utils/conditionalFieldEvaluator';
import { getApiBaseUrl } from '@/lib/api';

const API_BASE = getApiBaseUrl();
const FORM_CONFIG_STORAGE_KEY = 'itsm-form-configuration';

interface TicketCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TicketCreateModal({ open, onOpenChange, onSuccess }: TicketCreateModalProps) {
  const { user } = useAuth();

  // Form configuration
  const [allFields, setAllFields] = useState<FormField[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Agent-specific state
  const [users, setUsers] = useState<User[]>([]);
  const [ccUserIds, setCcUserIds] = useState<string[]>([]);
  const [selectedRequesterId, setSelectedRequesterId] = useState('');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');

  // Submission state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load form configuration and users when modal opens
  useEffect(() => {
    if (open) {
      loadFormConfiguration();
      fetchUsers();
      // Reset agent-specific fields
      setSelectedRequesterId(user?.id?.toString() || '');
      setSelectedAssigneeId('');
      setCcUserIds([]);
    } else {
      // Reset state when modal closes
      setFieldValues({});
      setError(null);
    }
  }, [open, user?.id]);

  const loadFormConfiguration = async () => {
    setIsLoadingConfig(true);
    try {
      // Try API first
      const response = await fetchWithAuth(`${API_BASE}/api/config/form`);
      const data = await response.json();

      if (data.success && data.config?.fields && data.config.fields.length > 0) {
        const fields = mergeWithDefaults(data.config.fields);
        setAllFields(fields);
        initializeFieldValues(fields);
        // Cache in localStorage
        localStorage.setItem(FORM_CONFIG_STORAGE_KEY, JSON.stringify(data.config));
      } else {
        throw new Error('No fields in API response');
      }
    } catch (error) {
      console.error('Failed to load form config from API:', error);

      // Fallback to localStorage
      try {
        const saved = localStorage.getItem(FORM_CONFIG_STORAGE_KEY);
        if (saved) {
          const config = JSON.parse(saved);
          const fields = mergeWithDefaults(config.fields || []);
          setAllFields(fields);
          initializeFieldValues(fields);
        } else {
          throw new Error('No cached config');
        }
      } catch (fallbackError) {
        console.error('Failed to load from localStorage:', fallbackError);
        // Final fallback to defaults
        const defaults = mergeWithDefaults([]);
        setAllFields(defaults);
        initializeFieldValues(defaults);
      }
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const initializeFieldValues = (fields: FormField[]) => {
    const initialValues: Record<string, any> = {};

    fields.forEach((field) => {
      // Skip conditional children (they're added when parent condition is met)
      const isConditionalChild =
        field.conditionalLogic?.enabled && field.conditionalLogic?.parentFieldId;

      if (isConditionalChild) {
        return; // Skip initialization
      }

      // Initialize root fields with appropriate empty values
      if (field.type === 'multiselect') {
        initialValues[field.id] = [];
      } else if (field.type === 'checkbox') {
        initialValues[field.id] = false;
      } else {
        initialValues[field.id] = field.defaultValue || '';
      }
    });

    setFieldValues(initialValues);
  };

  const fetchUsers = async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE}/api/users`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Convert user IDs to strings for type compatibility
          const usersWithStringIds = (data.users || []).map((u: any) => ({
            ...u,
            id: String(u.id),
          }));
          setUsers(usersWithStringIds);
        }
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      // Fallback: use current user
      if (user) {
        setUsers([
          {
            id: String(user.id),
            name: user.name,
            email: user.email,
            role: user.role,
            active: user.active || true,
            notificationPreferences: user.notificationPreferences || {},
          },
        ]);
      }
    }
  };

  const handleFieldValueChange = (fieldId: string, value: any) => {
    const newFieldValues = { ...fieldValues, [fieldId]: value };

    // Clear hidden fields
    const fieldsToHide = getFieldsToHide(allFields, newFieldValues, fieldId);
    fieldsToHide.forEach((hiddenFieldId) => {
      delete newFieldValues[hiddenFieldId];
    });

    // Initialize newly visible fields
    const changedField = allFields.find((f) => f.id === fieldId);
    if (changedField?.conditionalLogic?.enabled && changedField.conditionalLogic.childFields) {
      changedField.conditionalLogic.childFields.forEach((childId) => {
        const childField = allFields.find((f) => f.id === childId);
        if (childField && evaluateFieldVisibility(childField, allFields, newFieldValues)) {
          if (!(childId in newFieldValues)) {
            // Initialize with appropriate empty value
            if (childField.type === 'multiselect') {
              newFieldValues[childId] = [];
            } else if (childField.type === 'checkbox') {
              newFieldValues[childId] = false;
            } else {
              newFieldValues[childId] = '';
            }
          }
        }
      });
    }

    setFieldValues(newFieldValues);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        // Extract system fields from fieldValues
        title: fieldValues['system-title'] || '',
        description: fieldValues['system-description'] || '',
        priority: (fieldValues['system-priority'] || 'medium').toLowerCase(),
        category: fieldValues['system-category'] || 'General',

        // Agent-specific fields
        requester_id: Number(selectedRequesterId || user?.id),
        assignee_id: selectedAssigneeId ? Number(selectedAssigneeId) : null,
        department: user?.department || null,
        cc_user_ids: ccUserIds.map((id) => Number(id)),

        // Standard fields
        tags: [],

        // ALL field values (including system and custom)
        customFields: fieldValues,
      };

      const response = await fetchWithAuth(`${API_BASE}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        // Reset form
        setFieldValues({});
        setSelectedRequesterId('');
        setSelectedAssigneeId('');
        setCcUserIds([]);

        // Close modal and notify parent
        onOpenChange(false);
        onSuccess();
      } else {
        setError(data.error || 'Failed to create ticket');
      }
    } catch (err) {
      console.error('Create ticket error:', err);
      setError('Failed to create ticket. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
          <DialogDescription>Create a ticket on behalf of a user</DialogDescription>
        </DialogHeader>

        {isLoadingConfig ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading form configuration...</span>
          </div>
        ) : (
          <DynamicTicketForm
            allFields={allFields}
            fieldValues={fieldValues}
            onFieldValueChange={handleFieldValueChange}
            showRequesterField={true}
            showAssigneeField={true}
            selectedRequesterId={selectedRequesterId}
            onRequesterChange={setSelectedRequesterId}
            selectedAssigneeId={selectedAssigneeId}
            onAssigneeChange={setSelectedAssigneeId}
            users={users}
            ccUserIds={ccUserIds}
            onCcUserIdsChange={setCcUserIds}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            errorMessage={error}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
