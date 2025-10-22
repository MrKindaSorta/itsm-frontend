import { useCallback } from 'react';

export interface Toast {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

// Simple toast implementation using alerts for now
// Can be replaced with a proper toast library later
export function useToast() {
  const toast = useCallback((options: Toast) => {
    const message = options.description
      ? `${options.title}\n${options.description}`
      : options.title;

    if (options.variant === 'destructive') {
      alert(`❌ ${message}`);
    } else {
      alert(`✅ ${message}`);
    }
  }, []);

  return { toast };
}
