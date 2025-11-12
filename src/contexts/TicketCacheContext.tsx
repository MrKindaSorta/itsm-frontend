import { createContext, useContext, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Ticket, Activity } from '@/types';

const TICKETS_CACHE_KEY = 'itsm_tickets_cache';
const ACTIVITIES_CACHE_KEY = 'itsm_activities_cache';

interface TicketCacheEntry {
  ticket: Ticket;
  timestamp: number;
}

interface ActivitiesCacheEntry {
  activities: Activity[];
  timestamp: number;
}

interface TicketCacheContextType {
  // Ticket cache operations
  getTicket: (id: string) => Ticket | undefined;
  setTicket: (id: string, ticket: Ticket) => void;
  invalidateTicket: (id: string) => void;

  // Activities cache operations
  getActivities: (ticketId: string) => Activity[] | undefined;
  setActivities: (ticketId: string, activities: Activity[]) => void;
  addActivity: (ticketId: string, activity: Activity) => void;
  invalidateActivities: (ticketId: string) => void;

  // Cache management
  clearCache: () => void;
  shouldRefetch: (id: string, type: 'ticket' | 'activities', ttl: number) => boolean;
}

const TicketCacheContext = createContext<TicketCacheContextType | undefined>(undefined);

// TTL configurations (in milliseconds)
const TICKET_TTL = 5 * 60 * 1000; // 5 minutes (increased for better caching)
const ACTIVITIES_TTL = 5 * 60 * 1000; // 5 minutes (activities are mostly immutable)

// Helper functions for localStorage persistence
function serializeCache<T>(cache: Map<string, T>): string {
  return JSON.stringify(Array.from(cache.entries()));
}

function deserializeCache<T>(data: string): Map<string, T> {
  try {
    const entries = JSON.parse(data);
    const map = new Map<string, T>();

    // Restore Date objects from serialized strings
    entries.forEach(([key, value]: [string, any]) => {
      // For ticket cache entries
      if (value.ticket) {
        value.ticket.createdAt = new Date(value.ticket.createdAt);
        value.ticket.updatedAt = new Date(value.ticket.updatedAt);
        if (value.ticket.dueDate) value.ticket.dueDate = new Date(value.ticket.dueDate);
        if (value.ticket.resolvedAt) value.ticket.resolvedAt = new Date(value.ticket.resolvedAt);
        if (value.ticket.closedAt) value.ticket.closedAt = new Date(value.ticket.closedAt);
        if (value.ticket.sla) {
          value.ticket.sla.firstResponseDue = new Date(value.ticket.sla.firstResponseDue);
          value.ticket.sla.resolutionDue = new Date(value.ticket.sla.resolutionDue);
        }
      }

      // For activities cache entries
      if (value.activities) {
        value.activities = value.activities.map((activity: any) => ({
          ...activity,
          createdAt: new Date(activity.createdAt),
        }));
      }

      map.set(key, value);
    });

    return map;
  } catch (error) {
    console.error('Error deserializing cache:', error);
    return new Map();
  }
}

function loadCacheFromStorage<T>(key: string): Map<string, T> {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return new Map();
    return deserializeCache<T>(cached);
  } catch (error) {
    console.error('Error loading cache from storage:', error);
    return new Map();
  }
}

function saveCacheToStorage<T>(key: string, cache: Map<string, T>): void {
  try {
    localStorage.setItem(key, serializeCache(cache));
  } catch (error) {
    console.error('Error saving cache to storage:', error);
  }
}

export function TicketCacheProvider({ children }: { children: ReactNode }) {
  // Initialize caches from localStorage on mount
  const ticketCache = useRef<Map<string, TicketCacheEntry>>(
    loadCacheFromStorage<TicketCacheEntry>(TICKETS_CACHE_KEY)
  );
  const activitiesCache = useRef<Map<string, ActivitiesCacheEntry>>(
    loadCacheFromStorage<ActivitiesCacheEntry>(ACTIVITIES_CACHE_KEY)
  );

  // Persist caches to localStorage periodically
  useEffect(() => {
    const interval = setInterval(() => {
      saveCacheToStorage(TICKETS_CACHE_KEY, ticketCache.current);
      saveCacheToStorage(ACTIVITIES_CACHE_KEY, activitiesCache.current);
    }, 30000); // Save every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Ticket cache operations
  const getTicket = useCallback((id: string): Ticket | undefined => {
    const entry = ticketCache.current.get(id);
    if (!entry) return undefined;

    // Check if cache is still valid
    if (Date.now() - entry.timestamp > TICKET_TTL) {
      ticketCache.current.delete(id);
      return undefined;
    }

    return entry.ticket;
  }, []);

  const setTicket = useCallback((id: string, ticket: Ticket) => {
    ticketCache.current.set(id, {
      ticket,
      timestamp: Date.now(),
    });
    // Save to localStorage immediately for important updates
    saveCacheToStorage(TICKETS_CACHE_KEY, ticketCache.current);
  }, []);

  const invalidateTicket = useCallback((id: string) => {
    ticketCache.current.delete(id);
  }, []);

  // Activities cache operations
  const getActivities = useCallback((ticketId: string): Activity[] | undefined => {
    const entry = activitiesCache.current.get(ticketId);
    if (!entry) return undefined;

    // Check if cache is still valid
    if (Date.now() - entry.timestamp > ACTIVITIES_TTL) {
      activitiesCache.current.delete(ticketId);
      return undefined;
    }

    return entry.activities;
  }, []);

  const setActivities = useCallback((ticketId: string, activities: Activity[]) => {
    activitiesCache.current.set(ticketId, {
      activities,
      timestamp: Date.now(),
    });
  }, []);

  const addActivity = useCallback((ticketId: string, activity: Activity) => {
    const entry = activitiesCache.current.get(ticketId);
    if (entry) {
      // Prepend new activity to existing list
      entry.activities = [activity, ...entry.activities];
      entry.timestamp = Date.now(); // Update timestamp
    } else {
      // Create new cache entry if doesn't exist
      activitiesCache.current.set(ticketId, {
        activities: [activity],
        timestamp: Date.now(),
      });
    }
  }, []);

  const invalidateActivities = useCallback((ticketId: string) => {
    activitiesCache.current.delete(ticketId);
  }, []);

  // Cache management
  const clearCache = useCallback(() => {
    ticketCache.current.clear();
    activitiesCache.current.clear();
  }, []);

  const shouldRefetch = useCallback((id: string, type: 'ticket' | 'activities', ttl?: number): boolean => {
    if (type === 'ticket') {
      const entry = ticketCache.current.get(id);
      if (!entry) return true;
      const cacheTTL = ttl || TICKET_TTL;
      return Date.now() - entry.timestamp > cacheTTL;
    } else {
      const entry = activitiesCache.current.get(id);
      if (!entry) return true;
      const cacheTTL = ttl || ACTIVITIES_TTL;
      return Date.now() - entry.timestamp > cacheTTL;
    }
  }, []);

  const value: TicketCacheContextType = {
    getTicket,
    setTicket,
    invalidateTicket,
    getActivities,
    setActivities,
    addActivity,
    invalidateActivities,
    clearCache,
    shouldRefetch,
  };

  return (
    <TicketCacheContext.Provider value={value}>
      {children}
    </TicketCacheContext.Provider>
  );
}

export function useTicketCache() {
  const context = useContext(TicketCacheContext);
  if (context === undefined) {
    throw new Error('useTicketCache must be used within a TicketCacheProvider');
  }
  return context;
}
