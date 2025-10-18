import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Ticket,
  Users,
  Settings,
  FileText,
  BarChart3,
  Wrench,
  Bell,
  Moon,
  Sun,
  User,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
} from 'lucide-react';

export default function AgentLayout() {
  const { user, logout } = useAuth();
  const { setTheme, actualTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/agent/dashboard', icon: LayoutDashboard },
    { name: 'Tickets', href: '/agent/tickets', icon: Ticket },
    { name: 'Users', href: '/agent/users', icon: Users },
    { name: 'Customize', href: '/agent/customize', icon: Wrench },
    { name: 'Reports', href: '/agent/reports', icon: BarChart3 },
    { name: 'Knowledge Base', href: '/agent/knowledge-base', icon: FileText },
    { name: 'Settings', href: '/agent/settings', icon: Settings },
  ];

  const toggleTheme = () => {
    setTheme(actualTheme === 'dark' ? 'light' : 'dark');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 border-r bg-card transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-16'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            {sidebarOpen && (
              <Link to="/agent" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">IT</span>
                </div>
                <span className="font-bold text-lg">ITSM Agent</span>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="hidden lg:flex"
            >
              {sidebarOpen ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-2">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      } ${!sidebarOpen && 'justify-center'}`}
                      title={!sidebarOpen ? item.name : undefined}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {sidebarOpen && <span>{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t p-2 pb-3">
            {sidebarOpen && user && (
              <div className="mb-2 rounded-lg bg-secondary p-3">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.role}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className={`flex ${sidebarOpen ? 'space-x-1' : 'flex-col space-y-1'}`}>
              <Button
                variant="ghost"
                size={sidebarOpen ? "sm" : "icon"}
                onClick={toggleTheme}
                title="Toggle theme"
                className={sidebarOpen ? "flex-1" : ""}
              >
                {actualTheme === 'dark' ? (
                  <>
                    <Sun className="h-4 w-4" />
                    {sidebarOpen && <span className="ml-2">Light Mode</span>}
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4" />
                    {sidebarOpen && <span className="ml-2">Dark Mode</span>}
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                size={sidebarOpen ? "sm" : "icon"}
                onClick={logout}
                title="Logout"
                className={sidebarOpen ? "flex-1" : ""}
              >
                <LogOut className="h-4 w-4" />
                {sidebarOpen && <span className="ml-2">Logout</span>}
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-16'
        }`}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-4 lg:px-8">
            {/* Page Title / Breadcrumbs */}
            <div className="flex items-center space-x-4 lg:space-x-0">
              <div className="w-16 lg:hidden" /> {/* Spacer for mobile menu button */}
              <h1 className="text-xl font-semibold">
                {navigation.find((item) => location.pathname.startsWith(item.href))?.name ||
                  'Dashboard'}
              </h1>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-2">
              {/* Portal Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/portal/tickets/create')}
                title="User Portal"
              >
                <Home className="h-5 w-5" />
              </Button>

              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
              </Button>

              <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme">
                {actualTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              <Button variant="ghost" size="icon" onClick={logout} title="Logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
