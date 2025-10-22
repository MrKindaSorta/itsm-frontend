import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, PieChartIcon } from 'lucide-react';

interface TicketTrendsData {
  volumeTrend: Array<{
    date: string;
    created: number;
    resolved_same_day: number;
  }>;
  resolvedByDate: Array<{
    date: string;
    resolved: number;
  }>;
  statusDistribution: Array<{
    date: string;
    status: string;
    count: number;
  }>;
  priorityDistribution: Array<{
    priority: string;
    count: number;
    percentage: number;
  }>;
  topCategories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  peakTimes: Array<{
    day_of_week: number;
    hour: number;
    count: number;
  }>;
  backlog: Array<{
    date: string;
    cumulative_created: number;
    cumulative_resolved: number;
  }>;
}

interface Props {
  data: TicketTrendsData | null;
  loading: boolean;
}

const STATUS_COLORS: { [key: string]: string } = {
  new: '#3b82f6',
  open: '#8b5cf6',
  in_progress: '#f97316',
  waiting: '#eab308',
  resolved: '#22c55e',
  closed: '#6b7280',
};

const PRIORITY_COLORS: { [key: string]: string } = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TicketTrendsReport({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Loading ticket trends data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertDescription>No ticket trends data available for the selected period.</AlertDescription>
      </Alert>
    );
  }

  // Merge created and resolved data by date
  const volumeData = data.volumeTrend.map(item => {
    const resolved = data.resolvedByDate.find(r => r.date === item.date);
    return {
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      created: item.created,
      resolved: resolved?.resolved || 0,
    };
  });

  // Calculate backlog trend
  const backlogData = data.backlog.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    backlog: item.cumulative_created - item.cumulative_resolved,
  }));

  // Group status distribution by date
  const statusByDateMap: { [date: string]: { [status: string]: number } } = {};
  data.statusDistribution.forEach(item => {
    const date = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!statusByDateMap[date]) {
      statusByDateMap[date] = {};
    }
    statusByDateMap[date][item.status] = item.count;
  });

  const statusTrendData = Object.keys(statusByDateMap).map(date => ({
    date,
    ...statusByDateMap[date],
  }));

  // Create heatmap data for peak times
  const heatmapData: { [key: number]: { [key: number]: number } } = {};
  data.peakTimes.forEach(item => {
    if (!heatmapData[item.day_of_week]) {
      heatmapData[item.day_of_week] = {};
    }
    heatmapData[item.day_of_week][item.hour] = item.count;
  });

  const maxPeak = Math.max(...data.peakTimes.map(p => p.count), 1);

  // Calculate summary metrics
  const totalCreated = data.volumeTrend.reduce((sum, item) => sum + item.created, 0);
  const totalResolved = data.resolvedByDate.reduce((sum, item) => sum + item.resolved, 0);
  const currentBacklog = data.backlog.length > 0
    ? data.backlog[data.backlog.length - 1].cumulative_created - data.backlog[data.backlog.length - 1].cumulative_resolved
    : 0;

  // Calculate trend (last 7 days vs previous 7 days)
  const recentVolume = data.volumeTrend.slice(-7).reduce((sum, item) => sum + item.created, 0);
  const previousVolume = data.volumeTrend.slice(-14, -7).reduce((sum, item) => sum + item.created, 0);
  const trendPercentage = previousVolume > 0 ? ((recentVolume - previousVolume) / previousVolume) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Created</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCreated}</div>
            <p className="text-xs text-muted-foreground">tickets in period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resolved</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResolved}</div>
            <p className="text-xs text-muted-foreground">tickets closed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Backlog</CardTitle>
            <PieChartIcon className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentBacklog}</div>
            <p className="text-xs text-muted-foreground">unresolved tickets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">7-Day Trend</CardTitle>
            {trendPercentage >= 0 ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${trendPercentage >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {trendPercentage >= 0 ? '+' : ''}{trendPercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">vs previous week</p>
          </CardContent>
        </Card>
      </div>

      {/* Volume Trend: Created vs Resolved */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Volume: Created vs Resolved</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="created" stroke="#3b82f6" name="Created" strokeWidth={2} />
              <Line type="monotone" dataKey="resolved" stroke="#22c55e" name="Resolved" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Backlog Growth/Reduction */}
      {backlogData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Backlog Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={backlogData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="backlog"
                  stroke="#f97316"
                  fill="#f97316"
                  fillOpacity={0.3}
                  name="Backlog"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Status Distribution Over Time */}
      {statusTrendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={statusTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                {Object.keys(STATUS_COLORS).map(status => (
                  <Area
                    key={status}
                    type="monotone"
                    dataKey={status}
                    stackId="1"
                    stroke={STATUS_COLORS[status]}
                    fill={STATUS_COLORS[status]}
                    fillOpacity={0.6}
                    name={status.replace('_', ' ')}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Priority and Category Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.priorityDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ priority, count, percentage }) =>
                    `${priority}: ${count} (${percentage}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.priorityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.priority]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topCategories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="category" type="category" width={120} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="Tickets" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Peak Submission Times Heatmap */}
      {data.peakTimes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Peak Submission Times (Day/Hour Heatmap)</CardTitle>
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
                        const intensity = count / maxPeak;
                        return (
                          <td
                            key={day}
                            className="border p-2 text-center text-xs"
                            style={{
                              backgroundColor:
                                count > 0 ? `rgba(59, 130, 246, ${intensity * 0.8 + 0.2})` : '#f9fafb',
                              color: intensity > 0.5 ? 'white' : 'black',
                            }}
                            title={`${DAY_NAMES[day]} ${hour}:00 - ${count} tickets`}
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

      {/* Category Breakdown Table */}
      {data.topCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left text-xs font-medium">Rank</th>
                    <th className="p-2 text-left text-xs font-medium">Category</th>
                    <th className="p-2 text-right text-xs font-medium">Count</th>
                    <th className="p-2 text-right text-xs font-medium">Percentage</th>
                    <th className="p-2 text-left text-xs font-medium">Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topCategories.map((category, index) => (
                    <tr key={category.category} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-xs font-bold">{index + 1}</td>
                      <td className="p-2 text-xs font-medium">{category.category}</td>
                      <td className="p-2 text-right text-xs">{category.count}</td>
                      <td className="p-2 text-right text-xs">{category.percentage}%</td>
                      <td className="p-2">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${category.percentage}%` }}
                          />
                        </div>
                      </td>
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
