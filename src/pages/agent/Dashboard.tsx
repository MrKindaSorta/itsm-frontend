import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket, AlertTriangle, CheckCircle2, Clock, Loader2, ExternalLink, AlertCircle, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBadge } from '@/components/tickets/StatusBadge';
import { PriorityBadge } from '@/components/tickets/PriorityBadge';
import { SLAIndicator } from '@/components/tickets/SLAIndicator';
import { Link } from 'react-router-dom';
import { getInitials } from '@/lib/utils';
import type { Ticket as TicketType } from '@/types';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

interface DashboardMetrics {
  newTickets: number;
  highPriorityTickets: number;
  myOpenTickets: number;
  resolvedToday: number;
  slaWarnings: number;
}

interface AgentLogin {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentTickets, setRecentTickets] = useState<TicketType[]>([]);
  const [slaWarnings, setSlaWarnings] = useState<TicketType[]>([]);
  const [agentLogins, setAgentLogins] = useState<AgentLogin[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [isLoadingSLA, setIsLoadingSLA] = useState(true);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard metrics
  useEffect(() => {
    fetchMetrics();
  }, [user?.id]);

  // Fetch recent tickets
  useEffect(() => {
    fetchRecentTickets();
  }, []);

  // Fetch SLA warnings
  useEffect(() => {
    fetchSLAWarnings();
  }, []);

  // Fetch agent logins
  useEffect(() => {
    fetchAgentLogins();
  }, []);

  const fetchMetrics = async () => {
    setIsLoadingMetrics(true);
    setError(null);
    try {
      const url = new URL(`${API_BASE}/api/dashboard/metrics`);
      if (user?.id) {
        url.searchParams.set('user_id', user.id);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.success) {
        setMetrics(data.metrics);
      } else {
        setError(data.error || 'Failed to fetch metrics');
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  const fetchRecentTickets = async () => {
    setIsLoadingRecent(true);
    try {
      const response = await fetch(`${API_BASE}/api/dashboard/recent-tickets?limit=5&type=recent`);
      const data = await response.json();

      if (data.success) {
        // Transform date strings to Date objects
        const transformedTickets = data.tickets.map((ticket: any) => ({
          ...ticket,
          createdAt: new Date(ticket.createdAt),
          updatedAt: new Date(ticket.updatedAt),
          dueDate: ticket.dueDate ? new Date(ticket.dueDate) : undefined,
          sla: ticket.sla ? {
            ...ticket.sla,
            firstResponseDue: ticket.sla.firstResponseDue ? new Date(ticket.sla.firstResponseDue) : new Date(),
            resolutionDue: ticket.sla.resolutionDue ? new Date(ticket.sla.resolutionDue) : new Date(),
          } : null,
        }));
        setRecentTickets(transformedTickets);
      }
    } catch (err) {
      console.error('Error fetching recent tickets:', err);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const fetchSLAWarnings = async () => {
    setIsLoadingSLA(true);
    try {
      const response = await fetch(`${API_BASE}/api/dashboard/recent-tickets?limit=5&type=sla_warnings`);
      const data = await response.json();

      if (data.success) {
        // Transform date strings to Date objects
        const transformedTickets = data.tickets.map((ticket: any) => ({
          ...ticket,
          createdAt: new Date(ticket.createdAt),
          updatedAt: new Date(ticket.updatedAt),
          dueDate: ticket.dueDate ? new Date(ticket.dueDate) : undefined,
          sla: ticket.sla ? {
            ...ticket.sla,
            firstResponseDue: ticket.sla.firstResponseDue ? new Date(ticket.sla.firstResponseDue) : new Date(),
            resolutionDue: ticket.sla.resolutionDue ? new Date(ticket.sla.resolutionDue) : new Date(),
          } : null,
        }));
        setSlaWarnings(transformedTickets);
      }
    } catch (err) {
      console.error('Error fetching SLA warnings:', err);
    } finally {
      setIsLoadingSLA(false);
    }
  };

  const fetchAgentLogins = async () => {
    setIsLoadingAgents(true);
    try {
      const response = await fetch(`${API_BASE}/api/dashboard/agent-logins`);
      const data = await response.json();

      if (data.success) {
        setAgentLogins(data.agents);
      }
    } catch (err) {
      console.error('Error fetching agent logins:', err);
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const metricCards = metrics ? [
    { title: 'New Tickets', value: metrics.newTickets.toString(), icon: Ticket, color: 'text-blue-600' },
    { title: 'High Priority', value: metrics.highPriorityTickets.toString(), icon: AlertTriangle, color: 'text-red-600' },
    { title: 'My Open Tickets', value: (metrics.myOpenTickets || 0).toString(), icon: Clock, color: 'text-orange-600' },
    { title: 'Resolved Today', value: metrics.resolvedToday.toString(), icon: CheckCircle2, color: 'text-green-600' },
  ] : [];

  const isOnline = (lastLogin: string | null) => {
    if (!lastLogin) return false;
    const fiveMinutes = 5 * 60 * 1000;
    return new Date().getTime() - new Date(lastLogin).getTime() < fiveMinutes;
  };

  return (
    <div className="space-y-4">
      {/* Metrics Cards */}
      {error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
            <Button onClick={fetchMetrics} variant="outline" className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : isLoadingMetrics ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{metric.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent Tickets, SLA Warnings, and Agent Logins */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Tickets */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRecent ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent tickets found
              </p>
            ) : (
              <div className="space-y-3">
                {recentTickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    to={`/agent/tickets/${ticket.id}`}
                    className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-mono text-muted-foreground">{ticket.id}</span>
                          <StatusBadge status={ticket.status} />
                          <PriorityBadge priority={ticket.priority} />
                        </div>
                        <p className="text-sm font-medium truncate">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimeAgo(ticket.updatedAt)}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SLA Warnings */}
        <Card>
          <CardHeader>
            <CardTitle>SLA Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSLA ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : slaWarnings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No SLA warnings - great job!
              </p>
            ) : (
              <div className="space-y-3">
                {slaWarnings.map((ticket) => (
                  <Link
                    key={ticket.id}
                    to={`/agent/tickets/${ticket.id}`}
                    className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-mono text-muted-foreground">{ticket.id}</span>
                          <PriorityBadge priority={ticket.priority} />
                        </div>
                        <p className="text-sm font-medium truncate">{ticket.title}</p>
                        <div className="mt-2">
                          <SLAIndicator sla={ticket.sla} />
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agent Last Login */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Agent Last Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAgents ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : agentLogins.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No agent activity found
              </p>
            ) : (
              <div className="space-y-2">
                {agentLogins.map((agent) => (
                  <div key={agent.id} className="flex items-center gap-2 p-2 rounded-lg border">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium flex-shrink-0 relative">
                      {getInitials(agent.name)}
                      {isOnline(agent.lastLogin) && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-green-500 border-2 border-background rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {agent.lastLogin ? `Last seen: ${formatTimeAgo(new Date(agent.lastLogin))}` : 'Never logged in'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
