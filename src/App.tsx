import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { BrandingProvider } from '@/contexts/BrandingContext';
import { ViewPreferencesProvider } from '@/contexts/ViewPreferencesContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { TicketCacheProvider } from '@/contexts/TicketCacheContext';
import { UpdateNotification } from '@/components/UpdateNotification';
import { router } from '@/routes';

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <BrandingProvider>
          <AuthProvider>
            <TicketCacheProvider>
              <ViewPreferencesProvider>
                <RouterProvider router={router} />
                <UpdateNotification />
              </ViewPreferencesProvider>
            </TicketCacheProvider>
          </AuthProvider>
        </BrandingProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
