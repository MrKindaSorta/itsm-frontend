import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const { settings, isLoading: settingsLoading } = useSettings();
  const navigate = useNavigate();

  // Redirect if public signup is disabled
  useEffect(() => {
    if (!settingsLoading && settings && !settings.allowPublicSignup) {
      navigate('/login');
    }
  }, [settings, settingsLoading, navigate]);

  const validatePassword = (pwd: string): string | null => {
    if (!settings) return null;

    if (pwd.length < settings.passwordMinLength) {
      return `Password must be at least ${settings.passwordMinLength} characters`;
    }

    if (settings.passwordRequireUppercase && !/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }

    if (settings.passwordRequireLowercase && !/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }

    if (settings.passwordRequireNumbers && !/\d/.test(pwd)) {
      return 'Password must contain at least one number';
    }

    if (settings.passwordRequireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      return 'Password must contain at least one special character';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsLoading(true);

    try {
      await signup(name, email, password);
      navigate('/portal/tickets/create');
    } catch (err) {
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking settings
  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show message if public signup is disabled
  if (settings && !settings.allowPublicSignup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <ShieldAlert className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardTitle className="text-center">Sign Up Disabled</CardTitle>
            <CardDescription className="text-center">
              Public account creation is currently disabled. Please contact your administrator for access.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/login">Go to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-2xl">IT</span>
            </div>
            <span className="font-bold text-2xl">ITSM</span>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
            <CardDescription>Enter your information to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
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
                  minLength={settings?.passwordMinLength || 6}
                />
                {settings && (
                  <p className="text-xs text-muted-foreground">
                    {settings.passwordMinLength} chars minimum
                    {settings.passwordRequireUppercase && ', uppercase'}
                    {settings.passwordRequireLowercase && ', lowercase'}
                    {settings.passwordRequireNumbers && ', numbers'}
                    {settings.passwordRequireSpecial && ', special chars'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              {error && (
                <div className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <div className="text-sm text-center text-muted-foreground w-full">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
