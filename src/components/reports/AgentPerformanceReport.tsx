import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Award, TrendingUp, Users, AlertCircle } from 'lucide-react';

interface AgentMetric {
  id: number;
  name: string;
  email: string;
  total_assigned: number;
  resolved_count: number;
  open_count: number;
  urgent_count: number;
  sla_met_count: number;
  sla_breached_count: number;
  avg_resolution_minutes: number | null;
  avg_first_response_minutes: number | null;
}

interface WorkloadMetric {
  id: number;
  name: string;
  current_open_tickets: number;
  urgent_tickets: number;
  at_risk_tickets: number;
}

interface AgentReportData {
  agentMetrics: AgentMetric[];
  currentWorkload: WorkloadMetric[];
  byPriority: Array<{
    agent_name: string;
    priority: string;
    ticket_count: number;
  }>;
}

interface Props {
  data: AgentReportData | null;
  loading: boolean;
}

const PRIORITY_COLORS = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
};

function formatTime(minutes: number | null): string {
  if (minutes === null) return 'N/A';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 1440)}d`;
}

export default function AgentPerformanceReport({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Loading agent performance data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || data.agentMetrics.length === 0) {
    return (
      <Alert>
        <AlertDescription>No agent performance data available for the selected period.</AlertDescription>
      </Alert>
    );
  }

  // Calculate totals
  const totalResolved = data.agentMetrics.reduce((sum, agent) => sum + agent.resolved_count, 0);
  const totalOpen = data.agentMetrics.reduce((sum, agent) => sum + agent.open_count, 0);
  const avgSLACompliance =
    data.agentMetrics.reduce((sum, agent) => {
      const total = agent.sla_met_count + agent.sla_breached_count;
      return sum + (total > 0 ? (agent.sla_met_count / total) * 100 : 0);
    }, 0) / data.agentMetrics.length;

  // Top performers
  const topResolvers = [...data.agentMetrics]
    .sort((a, b) => b.resolved_count - a.resolved_count)
    .slice(0, 5);

  // Scatter plot data (response time vs resolution time)
  const scatterData = data.agentMetrics
    .filter(agent => agent.avg_first_response_minutes && agent.avg_resolution_minutes)
    .map(agent => ({
      name: agent.name,
      x: agent.avg_first_response_minutes || 0,
      y: agent.avg_resolution_minutes || 0,
      resolved: agent.resolved_count,
    }));

  // Agent priority distribution (for stacked bar chart)
  const agentNames = [...new Set(data.byPriority.map(item => item.agent_name))];
  const priorityData = agentNames.map(name => {
    const agentData: any = { name };
    data.byPriority
      .filter(item => item.agent_name === name)
      .forEach(item => {
        agentData[item.priority] = item.ticket_count;
      });
    return agentData;
  });

  // Prepare radar chart data for top 5 agents
  const radarData = topResolvers.map(agent => {
    const totalTickets = agent.total_assigned || 1;
    const slaTotal = agent.sla_met_count + agent.sla_breached_count || 1;
    return {
      agent: agent.name.split(' ')[0], // First name only
      'Resolution Rate': Math.round((agent.resolved_count / totalTickets) * 100),
      'SLA Compliance': Math.round((agent.sla_met_count / slaTotal) * 100),
      'Response Speed': agent.avg_first_response_minutes
        ? Math.max(0, 100 - Math.min(100, agent.avg_first_response_minutes / 10))
        : 0,
      'Volume': Math.min(100, (agent.total_assigned / Math.max(...data.agentMetrics.map(a => a.total_assigned))) * 100),
    };
  });

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.agentMetrics.length}</div>
            <p className="text-xs text-muted-foreground">with assigned tickets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resolved</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResolved}</div>
            <p className="text-xs text-muted-foreground">tickets closed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Open</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOpen}</div>
            <p className="text-xs text-muted-foreground">in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg SLA Compliance</CardTitle>
            <Award className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSLACompliance.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">across all agents</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers (Resolved Tickets)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topResolvers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} angle={-15} textAnchor="end" height={80} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="resolved_count" fill="#22c55e" name="Resolved" />
              <Bar dataKey="open_count" fill="#f97316" name="Open" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Agent Performance Radar */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Agent Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="agent" fontSize={12} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} fontSize={10} />
              <Radar name="Performance %" dataKey="Resolution Rate" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
              <Radar name="SLA %" dataKey="SLA Compliance" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
              <Radar name="Speed" dataKey="Response Speed" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Response Time vs Resolution Time Scatter */}
      {scatterData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Response Time vs Resolution Time (minutes)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="First Response Time"
                  fontSize={12}
                  label={{ value: 'First Response Time (min)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Avg Resolution Time"
                  fontSize={12}
                  label={{ value: 'Avg Resolution (min)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-2 shadow-lg">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-xs">First Response: {formatTime(data.x)}</p>
                        <p className="text-xs">Avg Resolution: {formatTime(data.y)}</p>
                        <p className="text-xs">Resolved: {data.resolved}</p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Scatter name="Agents" data={scatterData} fill="#3b82f6" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Current Workload Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Current Workload by Agent</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.currentWorkload.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} angle={-15} textAnchor="end" height={80} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="current_open_tickets" fill="#3b82f6" name="Open Tickets" />
              <Bar dataKey="urgent_tickets" fill="#ef4444" name="Urgent" />
              <Bar dataKey="at_risk_tickets" fill="#eab308" name="At Risk" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Agent Priority Distribution */}
      {priorityData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ticket Distribution by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} angle={-15} textAnchor="end" height={80} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="urgent" stackId="a" fill={PRIORITY_COLORS.urgent} name="Urgent" />
                <Bar dataKey="high" stackId="a" fill={PRIORITY_COLORS.high} name="High" />
                <Bar dataKey="medium" stackId="a" fill={PRIORITY_COLORS.medium} name="Medium" />
                <Bar dataKey="low" stackId="a" fill={PRIORITY_COLORS.low} name="Low" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Agent Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left text-xs font-medium">Rank</th>
                  <th className="p-2 text-left text-xs font-medium">Agent</th>
                  <th className="p-2 text-right text-xs font-medium">Total</th>
                  <th className="p-2 text-right text-xs font-medium">Resolved</th>
                  <th className="p-2 text-right text-xs font-medium">Open</th>
                  <th className="p-2 text-right text-xs font-medium">SLA Met</th>
                  <th className="p-2 text-right text-xs font-medium">SLA Breach</th>
                  <th className="p-2 text-right text-xs font-medium">First Response</th>
                  <th className="p-2 text-right text-xs font-medium">Avg Resolution</th>
                </tr>
              </thead>
              <tbody>
                {data.agentMetrics.map((agent, index) => {
                  const slaTotal = agent.sla_met_count + agent.sla_breached_count;
                  const slaRate = slaTotal > 0 ? ((agent.sla_met_count / slaTotal) * 100).toFixed(0) : 'N/A';
                  return (
                    <tr key={agent.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-xs font-bold">{index + 1}</td>
                      <td className="p-2 text-xs">
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-muted-foreground">{agent.email}</div>
                      </td>
                      <td className="p-2 text-right text-xs">{agent.total_assigned}</td>
                      <td className="p-2 text-right text-xs text-green-600 font-medium">{agent.resolved_count}</td>
                      <td className="p-2 text-right text-xs text-orange-600">{agent.open_count}</td>
                      <td className="p-2 text-right text-xs">
                        {agent.sla_met_count}
                        <span className="text-muted-foreground ml-1">({slaRate}%)</span>
                      </td>
                      <td className="p-2 text-right text-xs text-red-600">{agent.sla_breached_count}</td>
                      <td className="p-2 text-right text-xs">{formatTime(agent.avg_first_response_minutes)}</td>
                      <td className="p-2 text-right text-xs">{formatTime(agent.avg_resolution_minutes)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
