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
    {
      name: 'Create Ticket',
      href: '/portal/tickets/create',
      description: "Submit a support request and we'll get back to you as soon as possible"
    },
    {
      name: 'My Tickets',
      href: '/portal/tickets',
      description: 'View and track your support requests'
    },
    {
      name: 'Knowledge Base',
      href: '/portal/knowledge-base',
      description: 'Browse articles and find answers to common questions'
    },
    {
      name: 'Profile',
      href: '/portal/profile',
      description: null // Profile page has its own header design
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
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">IT</span>
                </div>
                <span className="font-bold text-xl">ITSM Portal</span>
              </Link>
            </div>

            {/* Navigation - Centered with expandable descriptions */}
            <nav className="hidden md:flex items-start justify-center flex-1 gap-6">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="flex flex-col items-center group"
                  >
                    <span
                      className={`text-sm font-medium transition-colors hover:text-primary ${
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {item.name}
                    </span>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isActive && item.description
                          ? 'max-h-20 opacity-100 mt-1'
                          : 'max-h-0 opacity-0'
                      }`}
                    >
                      {item.description && (
                        <p className="text-xs text-muted-foreground text-center max-w-[200px] leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Right side actions - Fixed width to match logo */}
            <div className="flex items-center justify-end w-48 pt-1">
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
          <div className="flex flex-col gap-3">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col px-3 py-2 rounded-md transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  <span className="text-xs font-medium">{item.name}</span>
                  {isActive && item.description && (
                    <span className="text-[10px] mt-1 opacity-90 leading-relaxed">
                      {item.description}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
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
