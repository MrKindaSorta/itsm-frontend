import type { User } from '@/types';

const USERS_CACHE_KEY = 'itsm_users_cache';
const USERS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface UsersCacheEntry {
  users: User[];
  timestamp: number;
}

export const usersCache = {
  /**
   * Get users from localStorage cache
   * Returns null if cache is invalid or doesn't exist
   */
  get(): User[] | null {
    try {
      const cached = localStorage.getItem(USERS_CACHE_KEY);
      if (!cached) return null;

      const entry: UsersCacheEntry = JSON.parse(cached);

      // Check if cache is still valid
      if (Date.now() - entry.timestamp > USERS_CACHE_TTL) {
        localStorage.removeItem(USERS_CACHE_KEY);
        return null;
      }

      return entry.users;
    } catch (error) {
      console.error('Error reading users cache:', error);
      return null;
    }
  },

  /**
   * Save users to localStorage cache
   */
  set(users: User[]): void {
    try {
      const entry: UsersCacheEntry = {
        users,
        timestamp: Date.now(),
      };
      localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(entry));
    } catch (error) {
      console.error('Error saving users cache:', error);
    }
  },

  /**
   * Clear users cache
   */
  clear(): void {
    try {
      localStorage.removeItem(USERS_CACHE_KEY);
    } catch (error) {
      console.error('Error clearing users cache:', error);
    }
  },

  /**
   * Check if cache is valid without retrieving data
   */
  isValid(): boolean {
    try {
      const cached = localStorage.getItem(USERS_CACHE_KEY);
      if (!cached) return false;

      const entry: UsersCacheEntry = JSON.parse(cached);
      return Date.now() - entry.timestamp <= USERS_CACHE_TTL;
    } catch (error) {
      return false;
    }
  },
};
