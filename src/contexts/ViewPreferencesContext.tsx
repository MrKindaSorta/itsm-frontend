import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { ViewPreferences, ColumnConfig } from '@/types';
import { DEFAULT_TICKET_COLUMNS } from '@/lib/utils';

interface ViewPreferencesContextType {
  preferences: ViewPreferences | null;
  ticketColumns: ColumnConfig[];
  isLoading: boolean;
  updateTicketColumns: (columns: ColumnConfig[]) => Promise<void>;
  resetToDefault: () => Promise<void>;
}

const ViewPreferencesContext = createContext<ViewPreferencesContextType | undefined>(undefined);

export function ViewPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<ViewPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get ticket columns from preferences or use defaults
  const ticketColumns = preferences?.ticketList?.columns || DEFAULT_TICKET_COLUMNS;

  // Load preferences from API when user changes
  useEffect(() => {
    if (user?.id) {
      loadPreferences();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  const loadPreferences = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}/view-preferences`);
      const data = await response.json();

      if (data.success && data.preferences) {
        setPreferences(data.preferences);
      } else {
        // No preferences found, use defaults
        setPreferences({
          ticketList: {
            columns: DEFAULT_TICKET_COLUMNS,
          },
        });
      }
    } catch (error) {
      console.error('Error loading view preferences:', error);
      // On error, use defaults
      setPreferences({
        ticketList: {
          columns: DEFAULT_TICKET_COLUMNS,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateTicketColumns = async (columns: ColumnConfig[]) => {
    if (!user?.id) return;

    const newPreferences: ViewPreferences = {
      ticketList: {
        columns,
      },
    };

    try {
      const response = await fetch(`/api/users/${user.id}/view-preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences: newPreferences }),
      });

      const data = await response.json();

      if (data.success) {
        setPreferences(newPreferences);
      } else {
        console.error('Failed to update preferences:', data.error);
        throw new Error(data.error || 'Failed to update preferences');
      }
    } catch (error) {
      console.error('Error updating view preferences:', error);
      throw error;
    }
  };

  const resetToDefault = async () => {
    if (!user?.id) return;

    const defaultPreferences: ViewPreferences = {
      ticketList: {
        columns: DEFAULT_TICKET_COLUMNS,
      },
    };

    try {
      const response = await fetch(`/api/users/${user.id}/view-preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences: defaultPreferences }),
      });

      const data = await response.json();

      if (data.success) {
        setPreferences(defaultPreferences);
      } else {
        throw new Error(data.error || 'Failed to reset preferences');
      }
    } catch (error) {
      console.error('Error resetting preferences:', error);
      throw error;
    }
  };

  return (
    <ViewPreferencesContext.Provider
      value={{
        preferences,
        ticketColumns,
        isLoading,
        updateTicketColumns,
        resetToDefault,
      }}
    >
      {children}
    </ViewPreferencesContext.Provider>
  );
}

export function useViewPreferences() {
  const context = useContext(ViewPreferencesContext);
  if (context === undefined) {
    throw new Error('useViewPreferences must be used within a ViewPreferencesProvider');
  }
  return context;
}
