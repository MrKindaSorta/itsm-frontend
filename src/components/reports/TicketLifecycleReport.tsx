import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  Cell,
} from 'recharts';
import { Clock, ArrowRightLeft, Hourglass, TrendingUp } from 'lucide-react';
import { generateColorPalette, getPriorityColor, getCategoryColor } from '@/utils/reportColors';

interface TicketLifecycleData {
  timeInStatus: Array<{
    status: string;
    avg_minutes: number | null;
  }>;
  resolutionStats: {
    total_resolved: number;
    mean_minutes: number;
    min_minutes: number;
    max_minutes: number;
  };
  resolutionDistribution: Array<{
    id: string;
    priority: string;
    category: string;
    resolution_minutes: number;
  }>;
  waitingTickets: Array<{
    id: string;
    title: string;
    priority: string;
    category: string;
    status: string;
    minutes_in_waiting: number;
    assignee_name: string | null;
  }>;
  reassignments: Array<{
    id: string;
    title: string;
    priority: string;
    category: string;
    reassignment_count: number;
  }>;
  firstResponseByCategory: Array<{
    category: string;
    ticket_count: number;
    avg_first_response_minutes: number;
  }>;
  lifecycleFunnel: Array<{
    status: string;
    count: number;
  }>;
}

interface Props {
  data: TicketLifecycleData | null;
  loading: boolean;
}

function formatTime(minutes: number | null): string {
  if (minutes === null) return 'N/A';
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
  return `${(minutes / 1440).toFixed(1)}d`;
}

function calculatePercentiles(data: number[]): { p25: number; p50: number; p75: number; p90: number } {
  const sorted = [...data].sort((a, b) => a - b);
  const p25 = sorted[Math.floor(sorted.length * 0.25)] || 0;
  const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
  const p75 = sorted[Math.floor(sorted.length * 0.75)] || 0;
  const p90 = sorted[Math.floor(sorted.length * 0.9)] || 0;
  return { p25, p50, p75, p90 };
}

export default function TicketLifecycleReport({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Loading ticket lifecycle data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertDescription>No ticket lifecycle data available for the selected period.</AlertDescription>
      </Alert>
    );
  }

  // Generate dynamic color palettes
  const statuses = data.timeInStatus.map(item => item.status);
  const STATUS_COLORS = generateColorPalette(statuses, 'status');

  // Calculate percentiles for resolution times
  const resolutionTimes = data.resolutionDistribution.map(t => t.resolution_minutes);
  const percentiles = resolutionTimes.length > 0 ? calculatePercentiles(resolutionTimes) : null;

  // Prepare funnel data
  const funnelData = data.lifecycleFunnel.map(item => ({
    name: item.status.replace('_', ' '),
    value: item.count,
    fill: STATUS_COLORS[item.status] || '#6b7280',
  }));

  // Group resolution times by priority for box plot visualization
  const resolutionByPriority: { [key: string]: number[] } = {};
  data.resolutionDistribution.forEach(ticket => {
    if (!resolutionByPriority[ticket.priority]) {
      resolutionByPriority[ticket.priority] = [];
    }
    resolutionByPriority[ticket.priority].push(ticket.resolution_minutes);
  });

  const boxPlotData = Object.keys(resolutionByPriority).map(priority => {
    const times = resolutionByPriority[priority];
    const sorted = [...times].sort((a, b) => a - b);
    return {
      priority,
      min: sorted[0] || 0,
      q1: sorted[Math.floor(times.length * 0.25)] || 0,
      median: sorted[Math.floor(times.length * 0.5)] || 0,
      q3: sorted[Math.floor(times.length * 0.75)] || 0,
      max: sorted[sorted.length - 1] || 0,
      mean: times.reduce((sum, t) => sum + t, 0) / times.length,
    };
  });

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resolved</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.resolutionStats.total_resolved}</div>
            <p className="text-xs text-muted-foreground">tickets completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(data.resolutionStats.mean_minutes)}</div>
            <p className="text-xs text-muted-foreground">mean time to resolve</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stuck in Waiting</CardTitle>
            <Hourglass className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{data.waitingTickets.length}</div>
            <p className="text-xs text-muted-foreground">tickets waiting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Reassignments</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.reassignments.length}</div>
            <p className="text-xs text-muted-foreground">tickets &gt;2 reassigns</p>
          </CardContent>
        </Card>
      </div>

      {/* Lifecycle Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Lifecycle Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <FunnelChart>
              <Tooltip />
              <Funnel dataKey="value" data={funnelData} isAnimationActive>
                <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Time in Each Status */}
      <Card>
        <CardHeader>
          <CardTitle>Average Time in Each Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.timeInStatus.filter(s => s.avg_minutes !== null)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" fontSize={12} />
              <YAxis fontSize={12} label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value: any) => formatTime(value)} />
              <Bar dataKey="avg_minutes" name="Avg Time" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Resolution Time Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resolution Time Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Mean:</span>
                <span className="text-lg font-bold">{formatTime(data.resolutionStats.mean_minutes)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Minimum:</span>
                <span className="text-lg">{formatTime(data.resolutionStats.min_minutes)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Maximum:</span>
                <span className="text-lg">{formatTime(data.resolutionStats.max_minutes)}</span>
              </div>
              {percentiles && (
                <>
                  <div className="border-t pt-2 mt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Percentiles:</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">25th percentile:</span>
                    <span>{formatTime(percentiles.p25)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">50th percentile (Median):</span>
                    <span className="font-medium">{formatTime(percentiles.p50)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">75th percentile:</span>
                    <span>{formatTime(percentiles.p75)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">90th percentile:</span>
                    <span>{formatTime(percentiles.p90)}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resolution Time by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={boxPlotData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="priority" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value: any) => formatTime(value)} />
                <Legend />
                <Bar dataKey="mean" fill="#3b82f6" name="Mean" />
                <Bar dataKey="median" fill="#22c55e" name="Median" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* First Response Time by Category */}
      {data.firstResponseByCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>First Response Time by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.firstResponseByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="category" type="category" width={120} fontSize={12} />
                <Tooltip formatter={(value: any) => formatTime(value)} />
                <Bar dataKey="avg_first_response_minutes" fill="#8b5cf6" name="Avg First Response" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tickets Stuck in Waiting */}
      {data.waitingTickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tickets Stuck in Waiting Status</CardTitle>
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
                    <th className="p-2 text-right text-xs font-medium">Time in Waiting</th>
                    <th className="p-2 text-left text-xs font-medium">Assignee</th>
                  </tr>
                </thead>
                <tbody>
                  {data.waitingTickets.slice(0, 20).map(ticket => (
                    <tr key={ticket.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-xs">{ticket.id}</td>
                      <td className="p-2 text-xs font-medium">{ticket.title}</td>
                      <td className="p-2 text-xs">
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: getPriorityColor(ticket.priority),
                            color: getPriorityColor(ticket.priority),
                          }}
                        >
                          {ticket.priority}
                        </Badge>
                      </td>
                      <td className="p-2 text-xs">{ticket.category}</td>
                      <td className="p-2 text-right text-xs font-medium text-yellow-600">
                        {formatTime(ticket.minutes_in_waiting)}
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

      {/* High Reassignment Tickets */}
      {data.reassignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tickets with Excessive Reassignments (&gt;2)</CardTitle>
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
                    <th className="p-2 text-right text-xs font-medium">Reassignment Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.reassignments.map(ticket => (
                    <tr key={ticket.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-xs">{ticket.id}</td>
                      <td className="p-2 text-xs font-medium">{ticket.title}</td>
                      <td className="p-2 text-xs">
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: getPriorityColor(ticket.priority),
                            color: getPriorityColor(ticket.priority),
                          }}
                        >
                          {ticket.priority}
                        </Badge>
                      </td>
                      <td className="p-2 text-xs">{ticket.category}</td>
                      <td className="p-2 text-right text-xs font-bold text-orange-600">
                        {ticket.reassignment_count}
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
