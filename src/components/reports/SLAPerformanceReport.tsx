import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface SLAReportData {
  overall: {
    total_tickets: number;
    green_tickets: number;
    yellow_tickets: number;
    red_tickets: number;
    compliance_rate: number;
  };
  byPriority: Array<{
    priority: string;
    total: number;
    green: number;
    breached: number;
    compliance_rate: number;
  }>;
  byCategory: Array<{
    category: string;
    total: number;
    green: number;
    breached: number;
    compliance_rate: number;
  }>;
  atRiskTickets: Array<{
    id: string;
    title: string;
    priority: string;
    category: string;
    sla_status: string;
    resolution_due: string;
    assignee_name: string | null;
  }>;
  trend: Array<{
    date: string;
    total: number;
    green: number;
    breached: number;
  }>;
  breachPattern: Array<{
    day_of_week: number;
    hour: number;
    breach_count: number;
  }>;
}

interface Props {
  data: SLAReportData | null;
  loading: boolean;
}

const COLORS = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
  blue: '#3b82f6',
};

const PRIORITY_COLORS = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SLAPerformanceReport({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Loading SLA performance data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertDescription>No data available for the selected period.</AlertDescription>
      </Alert>
    );
  }

  const complianceData = [
    { name: 'Met SLA', value: data.overall.green_tickets, color: COLORS.green },
    { name: 'At Risk', value: data.overall.yellow_tickets, color: COLORS.yellow },
    { name: 'Breached', value: data.overall.red_tickets, color: COLORS.red },
  ];

  // Prepare trend data with compliance rate
  const trendData = data.trend.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    compliance: item.total > 0 ? Math.round((item.green / item.total) * 100) : 0,
    breached: item.breached,
  }));

  // Create heatmap data structure for breach patterns
  const heatmapData: { [key: number]: { [key: number]: number } } = {};
  data.breachPattern.forEach(item => {
    if (!heatmapData[item.day_of_week]) {
      heatmapData[item.day_of_week] = {};
    }
    heatmapData[item.day_of_week][item.hour] = item.breach_count;
  });

  const maxBreaches = Math.max(...data.breachPattern.map(p => p.breach_count), 1);

  return (
    <div className="space-y-6">
      {/* Overall Compliance Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overall.compliance_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.overall.green_tickets} of {data.overall.total_tickets} tickets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Met</CardTitle>
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overall.green_tickets}</div>
            <p className="text-xs text-muted-foreground">Green status tickets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{data.overall.yellow_tickets}</div>
            <p className="text-xs text-muted-foreground">Yellow status tickets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Breached</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.overall.red_tickets}</div>
            <p className="text-xs text-muted-foreground">Red status tickets</p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Trend and Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>SLA Compliance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="compliance"
                  stroke={COLORS.green}
                  name="Compliance %"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="breached"
                  stroke={COLORS.red}
                  name="Breached"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SLA Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={complianceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }: any) =>
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {complianceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Compliance by Priority */}
      <Card>
        <CardHeader>
          <CardTitle>SLA Compliance by Priority</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.byPriority}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="green" fill={COLORS.green} name="Met SLA" />
              <Bar dataKey="breached" fill={COLORS.red} name="Breached" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Breaching Categories */}
      {data.byCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Breaching Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.byCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="category" type="category" width={120} fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="breached" fill={COLORS.red} name="Breached" />
                <Bar dataKey="green" fill={COLORS.green} name="Met SLA" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Breach Pattern Heatmap */}
      {data.breachPattern.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Breach Pattern (Day/Hour Heatmap)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 text-xs font-medium">Hour</th>
                    {DAY_NAMES.map((day, i) => (
                      <th key={i} className="border p-2 text-xs font-medium">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 24 }, (_, hour) => (
                    <tr key={hour}>
                      <td className="border p-2 text-xs font-medium">{hour}:00</td>
                      {Array.from({ length: 7 }, (_, day) => {
                        const count = heatmapData[day]?.[hour] || 0;
                        const intensity = count / maxBreaches;
                        return (
                          <td
                            key={day}
                            className="border p-2 text-center text-xs"
                            style={{
                              backgroundColor:
                                count > 0 ? `rgba(239, 68, 68, ${intensity * 0.8 + 0.2})` : '#f9fafb',
                              color: intensity > 0.5 ? 'white' : 'black',
                            }}
                            title={`${DAY_NAMES[day]} ${hour}:00 - ${count} breaches`}
                          >
                            {count > 0 ? count : ''}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* At-Risk Tickets Table */}
      {data.atRiskTickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>At-Risk Tickets (Yellow & Red)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left text-xs font-medium">ID</th>
                    <th className="p-2 text-left text-xs font-medium">Title</th>
                    <th className="p-2 text-left text-xs font-medium">Priority</th>
                    <th className="p-2 text-left text-xs font-medium">Category</th>
                    <th className="p-2 text-left text-xs font-medium">SLA Status</th>
                    <th className="p-2 text-left text-xs font-medium">Due</th>
                    <th className="p-2 text-left text-xs font-medium">Assignee</th>
                  </tr>
                </thead>
                <tbody>
                  {data.atRiskTickets.slice(0, 20).map(ticket => (
                    <tr key={ticket.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-xs">{ticket.id}</td>
                      <td className="p-2 text-xs font-medium">{ticket.title}</td>
                      <td className="p-2 text-xs">
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: PRIORITY_COLORS[ticket.priority as keyof typeof PRIORITY_COLORS],
                            color: PRIORITY_COLORS[ticket.priority as keyof typeof PRIORITY_COLORS],
                          }}
                        >
                          {ticket.priority}
                        </Badge>
                      </td>
                      <td className="p-2 text-xs">{ticket.category}</td>
                      <td className="p-2 text-xs">
                        <div
                          className="inline-block h-3 w-3 rounded-full"
                          style={{
                            backgroundColor:
                              ticket.sla_status === 'red'
                                ? COLORS.red
                                : ticket.sla_status === 'yellow'
                                ? COLORS.yellow
                                : COLORS.green,
                          }}
                        />
                      </td>
                      <td className="p-2 text-xs">
                        {new Date(ticket.resolution_due).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-2 text-xs">{ticket.assignee_name || 'Unassigned'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
