import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import lazyWithRetry from '@/utils/lazyWithRetry';

// Layouts
const PortalLayout = lazyWithRetry(() => import('@/components/layout/PortalLayout'));
const AgentLayout = lazyWithRetry(() => import('@/components/layout/AgentLayout'));

// Auth pages
const Login = lazyWithRetry(() => import('@/pages/auth/Login'));
const SignUp = lazyWithRetry(() => import('@/pages/auth/SignUp'));
const ForgotPassword = lazyWithRetry(() => import('@/pages/auth/ForgotPassword'));
const ChangePasswordFirstLogin = lazyWithRetry(() => import('@/pages/auth/ChangePasswordFirstLogin'));

// Portal pages
const PortalCreateTicket = lazyWithRetry(() => import('@/pages/portal/CreateTicket'));
const PortalMyTickets = lazyWithRetry(() => import('@/pages/portal/MyTickets'));
const PortalTicketDetail = lazyWithRetry(() => import('@/pages/portal/TicketDetail'));
const PortalProfile = lazyWithRetry(() => import('@/pages/portal/Profile'));
const PortalKnowledgeBase = lazyWithRetry(() => import('@/pages/portal/KnowledgeBase'));

// Agent pages
const AgentDashboard = lazyWithRetry(() => import('@/pages/agent/Dashboard'));
const AgentTickets = lazyWithRetry(() => import('@/pages/agent/Tickets'));
const AgentTicketDetail = lazyWithRetry(() => import('@/pages/agent/TicketDetail'));
const AgentUsers = lazyWithRetry(() => import('@/pages/agent/Users'));
const AgentCustomize = lazyWithRetry(() => import('@/pages/agent/Customize'));
const AgentReports = lazyWithRetry(() => import('@/pages/agent/Reports'));
const AgentBilling = lazyWithRetry(() => import('@/pages/agent/Billing'));
const AgentSettings = lazyWithRetry(() => import('@/pages/agent/Settings'));
const AgentKnowledgeBase = lazyWithRetry(() => import('@/pages/agent/KnowledgeBase'));
const AgentAbout = lazyWithRetry(() => import('@/pages/agent/About'));

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
