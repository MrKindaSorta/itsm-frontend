import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBranding } from '@/contexts/BrandingContext';
import { useSettings } from '@/contexts/SettingsContext';
import { usePrefetchTickets } from '@/hooks/useTicketsQuery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<{message: string, accountLocked?: boolean, minutesRemaining?: number} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { branding } = useBranding();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { prefetchTickets, prefetchClosedCount } = usePrefetchTickets();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);

      // Check if password change is required
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.requirePasswordChange) {
          navigate('/auth/change-password');
          return;
        }
      }

      // Prefetch tickets data before navigation for instant page load
      const storedUserForRedirect = localStorage.getItem('user');
      if (storedUserForRedirect) {
        const userDataForRedirect = JSON.parse(storedUserForRedirect);

        // For agents/managers/admins, prefetch tickets data
        if (['agent', 'manager', 'admin'].includes(userDataForRedirect.role)) {
          // Fire prefetch requests in background (don't await - let them complete while navigating)
          prefetchTickets({ statusFilter: 'all' });
          prefetchClosedCount();
          navigate('/agent/dashboard');
        } else {
          navigate('/portal/tickets/create');
        }
      }
    } catch (err: any) {
      setError({
        message: err.message || 'Invalid email or password',
        accountLocked: err.accountLocked,
        minutesRemaining: err.minutesRemaining
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            {branding.logo?.url || branding.logoSmall?.url ? (
              <img
                src={branding.logo?.url || branding.logoSmall?.url}
                alt={branding.content.companyName}
                className="h-12 w-auto"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-2xl">
                  {branding.content.companyName.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <span className="font-bold text-2xl">{branding.content.companyName}</span>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              {branding.content.loginTitle || 'Welcome back'}
            </CardTitle>
            <CardDescription>
              {branding.content.loginSubtitle || 'Enter your credentials to access your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              {error && (
                <div className={`text-sm text-center p-3 rounded ${
                  error.accountLocked
                    ? 'text-amber-800 bg-amber-50 dark:text-amber-200 dark:bg-amber-950 border border-amber-200 dark:border-amber-800'
                    : 'text-destructive bg-destructive/10'
                }`}>
                  <p className="font-medium">{error.message}</p>
                  {error.accountLocked && error.minutesRemaining && (
                    <p className="text-xs mt-1 opacity-90">
                      Your account will automatically unlock in approximately {error.minutesRemaining} minute{error.minutesRemaining !== 1 ? 's' : ''}.
                    </p>
                  )}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <Link to="/auth/forgot-password" className="text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {settings?.allowPublicSignup && (
              <div className="text-sm text-center text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/auth/signup" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
