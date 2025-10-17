import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { BrandingProvider } from '@/contexts/BrandingContext';
import { ViewPreferencesProvider } from '@/contexts/ViewPreferencesContext';
import { router } from '@/routes';

function App() {
  return (
    <ThemeProvider>
      <BrandingProvider>
        <AuthProvider>
          <ViewPreferencesProvider>
            <RouterProvider router={router} />
          </ViewPreferencesProvider>
        </AuthProvider>
      </BrandingProvider>
    </ThemeProvider>
  );
}

export default App;
