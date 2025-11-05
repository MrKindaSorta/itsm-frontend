import { useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { BrandingProvider } from '@/contexts/BrandingContext';
import { ViewPreferencesProvider } from '@/contexts/ViewPreferencesContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { TicketCacheProvider } from '@/contexts/TicketCacheContext';
import { UpdateNotification } from '@/components/UpdateNotification';
import { IdleTimeoutWarning } from '@/components/auth/IdleTimeoutWarning';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { router } from '@/routes';

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
    <ThemeProvider>
      <SettingsProvider>
        <BrandingProvider>
          <AuthProvider>
            <TicketCacheProvider>
              <ViewPreferencesProvider>
                <AppContent />
              </ViewPreferencesProvider>
            </TicketCacheProvider>
          </AuthProvider>
        </BrandingProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
