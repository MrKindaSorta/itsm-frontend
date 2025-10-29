import { createContext, useContext, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Ticket, Activity } from '@/types';

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
const TICKET_TTL = 2 * 60 * 1000; // 2 minutes
const ACTIVITIES_TTL = 5 * 60 * 1000; // 5 minutes (activities are mostly immutable)

export function TicketCacheProvider({ children }: { children: ReactNode }) {
  // Use refs to avoid re-renders when cache updates
  const ticketCache = useRef<Map<string, TicketCacheEntry>>(new Map());
  const activitiesCache = useRef<Map<string, ActivitiesCacheEntry>>(new Map());

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
