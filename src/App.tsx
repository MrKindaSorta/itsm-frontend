import { useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { BrandingProvider } from '@/contexts/BrandingContext';
import { ViewPreferencesProvider } from '@/contexts/ViewPreferencesContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { TicketCacheProvider } from '@/contexts/TicketCacheContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { UpdateNotification } from '@/components/UpdateNotification';
import { IdleTimeoutWarning } from '@/components/auth/IdleTimeoutWarning';
import { Toaster } from '@/components/ui/toaster';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { router } from '@/routes';

// Create a React Query client with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});

function AppContent() {
  const { logout, isAuthenticated } = useAuth();
  const [showWarning, setShowWarning] = useState(false);

  // Idle timeout: 30 minutes inactive, 60 second warning
  const { resetTimer } = useIdleTimeout({
    timeout: 30 * 60 * 1000, // 30 minutes
    warningTime: 60 * 1000,  // 60 seconds warning
    enabled: isAuthenticated,
    onWarning: () => setShowWarning(true),
    onTimeout: () => {
      setShowWarning(false);
      logout();
    },
  });

  const handleStayLoggedIn = () => {
    setShowWarning(false);
    resetTimer();
  };

  const handleLogout = () => {
    setShowWarning(false);
    logout();
  };

  return (
    <>
      <RouterProvider router={router} />
      <UpdateNotification />
      <Toaster />
      <IdleTimeoutWarning
        open={showWarning}
        warningSeconds={60}
        onStayLoggedIn={handleStayLoggedIn}
        onLogout={handleLogout}
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SettingsProvider>
          <BrandingProvider>
            <AuthProvider>
              <WebSocketProvider>
                <TicketCacheProvider>
                  <ViewPreferencesProvider>
                    <AppContent />
                  </ViewPreferencesProvider>
                </TicketCacheProvider>
              </WebSocketProvider>
            </AuthProvider>
          </BrandingProvider>
        </SettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
