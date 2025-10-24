import React, { createContext, useContext, useState, useEffect } from 'react';
import type { SystemSettings } from '@/types';

interface SettingsContextType {
  settings: SystemSettings | null;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (updates: Partial<SystemSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_SETTINGS: SystemSettings = {
  allowPublicSignup: true,
  defaultAssignment: 'manual',
  enableTimeTracking: true,
  enableAttachments: true,
  enableEmailToTicket: false,
  enableKnowledgeBase: true,
  emailFromName: 'ITSM Support',
  enableEmailNotifications: true,
  enableEmailReplies: false,
  passwordMinLength: 6,
  passwordRequireUppercase: false,
  passwordRequireLowercase: false,
  passwordRequireNumbers: false,
  passwordRequireSpecial: false,
  passwordExpiryDays: 0,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  sessionTimeoutMinutes: 480,
  enable2FA: false,
  forcePasswordChangeFirstLogin: true,
  permissionMatrix: {
    'ticket:create': ['user', 'agent', 'manager', 'admin'],
    'ticket:view:own': ['user', 'agent', 'manager', 'admin'],
    'ticket:view:all': ['agent', 'manager', 'admin'],
    'ticket:edit': ['agent', 'manager', 'admin'],
    'ticket:delete': ['admin'],
    'ticket:assign': ['manager', 'admin'],
    'ticket:close': ['manager', 'admin'],
    'ticket:resolve': ['agent', 'manager', 'admin'],
    'user:view': ['agent', 'manager', 'admin'],
    'user:create': ['admin'],
    'user:edit': ['manager', 'admin'],
    'user:delete': ['admin'],
    'settings:view': ['manager', 'admin'],
    'settings:edit': ['admin'],
    'customize:view': ['manager', 'admin'],
    'customize:edit': ['admin'],
    'reports:view': ['agent', 'manager', 'admin'],
    'reports:export': ['manager', 'admin'],
    'kb:view': ['user', 'agent', 'manager', 'admin'],
    'kb:create': ['agent', 'manager', 'admin'],
    'kb:edit': ['agent', 'manager', 'admin'],
    'kb:delete': ['manager', 'admin'],
    'dashboard:view': ['agent', 'manager', 'admin']
  }
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const response = await fetch(`/api/settings`);
      const data = await response.json();

      if (data.success && data.settings) {
        setSettings(data.settings);
      } else {
        // Use defaults if API fails
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Use defaults if fetch fails
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<SystemSettings>) => {
    try {
      const response = await fetch(`/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success && data.settings) {
        setSettings(data.settings);
      } else {
        throw new Error(data.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        refreshSettings,
        updateSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
