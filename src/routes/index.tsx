import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Layouts
const PortalLayout = lazy(() => import('@/components/layout/PortalLayout'));
const AgentLayout = lazy(() => import('@/components/layout/AgentLayout'));

// Auth pages
const Login = lazy(() => import('@/pages/auth/Login'));
const SignUp = lazy(() => import('@/pages/auth/SignUp'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const ChangePasswordFirstLogin = lazy(() => import('@/pages/auth/ChangePasswordFirstLogin'));

// Portal pages
const PortalCreateTicket = lazy(() => import('@/pages/portal/CreateTicket'));
const PortalMyTickets = lazy(() => import('@/pages/portal/MyTickets'));
const PortalTicketDetail = lazy(() => import('@/pages/portal/TicketDetail'));
const PortalProfile = lazy(() => import('@/pages/portal/Profile'));
const PortalKnowledgeBase = lazy(() => import('@/pages/portal/KnowledgeBase'));

// Agent pages
const AgentDashboard = lazy(() => import('@/pages/agent/Dashboard'));
const AgentTickets = lazy(() => import('@/pages/agent/Tickets'));
const AgentTicketDetail = lazy(() => import('@/pages/agent/TicketDetail'));
const AgentUsers = lazy(() => import('@/pages/agent/Users'));
const AgentCustomize = lazy(() => import('@/pages/agent/Customize'));
const AgentReports = lazy(() => import('@/pages/agent/Reports'));
const AgentBilling = lazy(() => import('@/pages/agent/Billing'));
const AgentSettings = lazy(() => import('@/pages/agent/Settings'));
const AgentKnowledgeBase = lazy(() => import('@/pages/agent/KnowledgeBase'));
const AgentAbout = lazy(() => import('@/pages/agent/About'));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
      <p className="mt-4 text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Wrapper for lazy loaded components
const Lazy = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/auth/login" replace />,
  },
  {
    path: '/auth',
    children: [
      {
        path: 'login',
        element: (
          <Lazy>
            <Login />
          </Lazy>
        ),
      },
      {
        path: 'signup',
        element: (
          <Lazy>
            <SignUp />
          </Lazy>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <Lazy>
            <ForgotPassword />
          </Lazy>
        ),
      },
      {
        path: 'change-password',
        element: (
          <Lazy>
            <ChangePasswordFirstLogin />
          </Lazy>
        ),
      },
    ],
  },
  {
    path: '/portal',
    element: (
      <ProtectedRoute>
        <Lazy>
          <PortalLayout />
        </Lazy>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/portal/tickets/create" replace />,
      },
      {
        path: 'tickets/create',
        element: (
          <Lazy>
            <PortalCreateTicket />
          </Lazy>
        ),
      },
      {
        path: 'tickets',
        element: (
          <Lazy>
            <PortalMyTickets />
          </Lazy>
        ),
      },
      {
        path: 'tickets/:id',
        element: (
          <Lazy>
            <PortalTicketDetail />
          </Lazy>
        ),
      },
      {
        path: 'knowledge-base',
        element: (
          <Lazy>
            <PortalKnowledgeBase />
          </Lazy>
        ),
      },
      {
        path: 'profile',
        element: (
          <Lazy>
            <PortalProfile />
          </Lazy>
        ),
      },
    ],
  },
  {
    path: '/agent',
    element: (
      <ProtectedRoute allowedRoles={['agent', 'manager', 'admin']}>
        <Lazy>
          <AgentLayout />
        </Lazy>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/agent/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <Lazy>
            <AgentDashboard />
          </Lazy>
        ),
      },
      {
        path: 'tickets',
        element: (
          <Lazy>
            <AgentTickets />
          </Lazy>
        ),
      },
      {
        path: 'tickets/:id',
        element: (
          <Lazy>
            <AgentTicketDetail />
          </Lazy>
        ),
      },
      {
        path: 'users',
        element: (
          <Lazy>
            <AgentUsers />
          </Lazy>
        ),
      },
      {
        path: 'customize',
        element: (
          <Lazy>
            <AgentCustomize />
          </Lazy>
        ),
      },
      {
        path: 'reports',
        element: (
          <Lazy>
            <AgentReports />
          </Lazy>
        ),
      },
      {
        path: 'billing',
        element: (
          <Lazy>
            <AgentBilling />
          </Lazy>
        ),
      },
      {
        path: 'settings',
        element: (
          <Lazy>
            <AgentSettings />
          </Lazy>
        ),
      },
      {
        path: 'knowledge-base',
        element: (
          <Lazy>
            <AgentKnowledgeBase />
          </Lazy>
        ),
      },
      {
        path: 'profile',
        element: (
          <Lazy>
            <PortalProfile />
          </Lazy>
        ),
      },
      {
        path: 'about',
        element: (
          <Lazy>
            <AgentAbout />
          </Lazy>
        ),
      },
    ],
  },
]);
