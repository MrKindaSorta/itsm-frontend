import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ViewPreferencesProvider } from '@/contexts/ViewPreferencesContext';
import { router } from '@/routes';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ViewPreferencesProvider>
          <RouterProvider router={router} />
        </ViewPreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
