import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Moon, Sun, User, LogOut, ChevronDown } from 'lucide-react';

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const { setTheme, actualTheme } = useTheme();
  const location = useLocation();

  const navigation = [
    { name: 'Create Ticket', href: '/portal/tickets/create' },
    { name: 'My Tickets', href: '/portal/tickets' },
    { name: 'Knowledge Base', href: '/portal/knowledge-base' },
    { name: 'Profile', href: '/portal/profile' },
  ];

  // Page information for animated header
  const pageInfo: Record<string, { title: string; description: string } | null> = {
    '/portal/tickets/create': {
      title: 'Create New Ticket',
      description: "Submit a support request and we'll get back to you as soon as possible"
    },
    '/portal/tickets': {
      title: 'My Tickets',
      description: 'View and track your support requests'
    },
    '/portal/knowledge-base': {
      title: 'Knowledge Base',
      description: 'Browse articles and find answers to common questions'
    },
    '/portal/profile': null, // Profile page has its own header design
  };

  // Get current page info
  const currentPageInfo = pageInfo[location.pathname];

  const toggleTheme = () => {
    setTheme(actualTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center">
            {/* Logo/Brand - Fixed width */}
            <div className="flex items-center w-48">
              <Link to="/portal" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">IT</span>
                </div>
                <span className="font-bold text-xl">ITSM Portal</span>
              </Link>
            </div>

            {/* Navigation - Centered */}
            <nav className="hidden md:flex items-center justify-center flex-1 space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === item.href
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Right side actions - Fixed width to match logo */}
            <div className="flex items-center justify-end w-48">
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

        {/* Mobile Navigation */}
        <nav className="md:hidden border-t px-4 py-2">
          <div className="flex flex-wrap gap-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                  location.pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        {/* Animated Page Header */}
        <div
          className={`border-t overflow-hidden transition-all duration-500 ease-in-out ${
            currentPageInfo ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="container mx-auto px-4 py-6 bg-gradient-to-r from-muted/30 to-transparent">
            <div
              className={`transform transition-all duration-500 delay-75 ${
                currentPageInfo ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
              }`}
            >
              {currentPageInfo && (
                <>
                  <h1 className="text-2xl md:text-3xl font-bold mb-1">{currentPageInfo.title}</h1>
                  <p className="text-sm md:text-base text-muted-foreground">{currentPageInfo.description}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 ITSM Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
