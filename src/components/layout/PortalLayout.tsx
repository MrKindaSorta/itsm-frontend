import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useBranding } from '@/contexts/BrandingContext';
import { Button } from '@/components/ui/button';
import { NotificationTray } from '@/components/notifications/NotificationTray';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Moon, Sun, User, LogOut, ChevronDown, LayoutDashboard, PlusCircle, Ticket, BookOpen, UserCircle } from 'lucide-react';

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const { setTheme, actualTheme } = useTheme();
  const { branding } = useBranding();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    {
      name: 'Create Ticket',
      href: '/portal/tickets/create',
      description: "Submit a support request and we'll get back to you as soon as possible",
      icon: PlusCircle,
      mobileLabel: 'Create'
    },
    {
      name: 'My Tickets',
      href: '/portal/tickets',
      description: 'View and track your support requests',
      icon: Ticket,
      mobileLabel: 'Tickets'
    },
    {
      name: 'Knowledge Base',
      href: '/portal/knowledge-base',
      description: 'Browse articles and find answers to common questions',
      icon: BookOpen,
      mobileLabel: 'KB'
    },
    {
      name: 'Profile',
      href: '/portal/profile',
      description: null, // Profile page has its own header design
      icon: UserCircle,
      mobileLabel: 'Profile'
    },
  ];

  const toggleTheme = () => {
    setTheme(actualTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex min-h-16 items-start py-3">
            {/* Logo/Brand - Fixed width */}
            <div className="flex items-center w-48 pt-1">
              <Link to="/portal" className="flex items-center space-x-2">
                {branding.logoSmall?.url || branding.logo?.url ? (
                  <img
                    src={branding.logoSmall?.url || branding.logo?.url}
                    alt={branding.content.companyName}
                    className="h-8 w-auto"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-lg">
                      {branding.content.companyName.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="font-bold text-xl">{branding.content.companyName}</span>
              </Link>
            </div>

            {/* Navigation - Centered */}
            <nav className="hidden md:flex items-center justify-center flex-1 gap-4">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-4 py-2 rounded-t-lg transition-all border-b-2 ${
                      isActive
                        ? 'bg-accent/50 border-primary'
                        : 'border-transparent hover:bg-accent/30 hover:border-accent'
                    }`}
                  >
                    <span
                      className={`text-sm font-medium transition-colors ${
                        isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Right side actions - Fixed width to match logo */}
            <div className="flex items-center justify-end w-48 pt-1 gap-2">
              {/* Agent Dashboard Button - Only shown for agent/manager/admin */}
              {user && ['agent', 'manager', 'admin'].includes(user.role) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/agent/dashboard')}
                  title="Agent Dashboard"
                >
                  <LayoutDashboard className="h-5 w-5" />
                </Button>
              )}

              {/* Notification Bell */}
              <NotificationTray />

              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <span className="hidden lg:inline text-sm font-medium">{user.name}</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        <p className="text-xs leading-none text-muted-foreground capitalize">{user.role}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/portal/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>View Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                      {actualTheme === 'dark' ? (
                        <>
                          <Sun className="mr-2 h-4 w-4" />
                          <span>Light Mode</span>
                        </>
                      ) : (
                        <>
                          <Moon className="mr-2 h-4 w-4" />
                          <span>Dark Mode</span>
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

      </header>

      {/* Main Content - Add bottom padding on mobile for fixed nav */}
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
        <div className="flex items-center justify-around h-16 px-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-xs font-medium">{item.mobileLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <footer className="border-t py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {branding.content.companyName}. All rights reserved.</p>
          {branding.portalSettings?.showTagline && branding.content.tagline && (
            <p className="mt-1 text-xs">{branding.content.tagline}</p>
          )}
        </div>
      </footer>
    </div>
  );
}
