import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SelectRoot, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Calendar, Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SLAPerformanceReport from '@/components/reports/SLAPerformanceReport';
import AgentPerformanceReport from '@/components/reports/AgentPerformanceReport';
import TicketTrendsReport from '@/components/reports/TicketTrendsReport';
import TicketLifecycleReport from '@/components/reports/TicketLifecycleReport';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://itsm-backend.joshua-r-klimek.workers.dev';

type DateRange = '7' | '30' | '60' | '90';
type ReportType = 'sla' | 'agent' | 'trends' | 'lifecycle';

export default function Reports() {
  const [activeReport, setActiveReport] = useState<ReportType>('sla');
  const [dateRange, setDateRange] = useState<DateRange>('30');
  const [loading, setLoading] = useState(false);

  const [slaData, setSlaData] = useState(null);
  const [agentData, setAgentData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [lifecycleData, setLifecycleData] = useState(null);

  // Filter options and state
  const [availablePriorities, setAvailablePriorities] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [prioritiesRes, categoriesRes] = await Promise.all([
          fetch(`${API_BASE}/api/config/priorities`),
          fetch(`${API_BASE}/api/config/categories`)
        ]);

        if (prioritiesRes.ok) {
          const data = await prioritiesRes.json();
          if (data.success) {
            setAvailablePriorities(data.priorities);
          }
        }

        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          if (data.success) {
            setAvailableCategories(data.categories);
          }
        }
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
      }
    };

    fetchFilterOptions();
  }, []);

  // Calculate date range
  const getDateRange = (days: string) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  };

  // Fetch report data
  const fetchReportData = async (reportType: ReportType) => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(dateRange);
      const token = localStorage.getItem('token');

      const endpoint = {
        sla: '/api/reports/sla-performance',
        agent: '/api/reports/agent-performance',
        trends: '/api/reports/ticket-trends',
        lifecycle: '/api/reports/ticket-lifecycle',
      }[reportType];

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          startDate,
          endDate,
          priority: selectedPriorities,
          category: selectedCategories,
          department: selectedDepartments,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const result = await response.json();

      if (result.success) {
        switch (reportType) {
          case 'sla':
            setSlaData(result.data);
            break;
          case 'agent':
            setAgentData(result.data);
            break;
          case 'trends':
            setTrendsData(result.data);
            break;
          case 'lifecycle':
            setLifecycleData(result.data);
            break;
        }
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when date range, filters, or active report changes
  useEffect(() => {
    fetchReportData(activeReport);
  }, [dateRange, activeReport, selectedPriorities, selectedCategories, selectedDepartments]);

  // Helper functions for filter management
  const togglePriority = (priority: string) => {
    setSelectedPriorities(prev =>
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSelectedPriorities([]);
    setSelectedCategories([]);
    setSelectedDepartments([]);
  };

  const hasActiveFilters = selectedPriorities.length > 0 || selectedCategories.length > 0 || selectedDepartments.length > 0;

  // Generate filter summary for CSV
  const generateFilterSummary = (): string => {
    const filters = [];
    if (selectedPriorities.length > 0) {
      filters.push(`Priorities: ${selectedPriorities.join(', ')}`);
    }
    if (selectedCategories.length > 0) {
      filters.push(`Categories: ${selectedCategories.join(', ')}`);
    }
    if (selectedDepartments.length > 0) {
      filters.push(`Departments: ${selectedDepartments.join(', ')}`);
    }

    if (filters.length === 0) {
      return 'Filters: None (All data)\\n';
    }
    return `Filters Applied:\\n${filters.join('\\n')}\\n`;
  };

  // Export to CSV
  const handleExport = () => {
    let csvContent = '';
    let filename = '';
    const filterSummary = generateFilterSummary();

    switch (activeReport) {
      case 'sla':
        if (slaData) {
          filename = `sla-performance-${dateRange}days.csv`;
          csvContent = filterSummary + '\\n' + generateSLACSV(slaData);
        }
        break;
      case 'agent':
        if (agentData) {
          filename = `agent-performance-${dateRange}days.csv`;
          csvContent = filterSummary + '\\n' + generateAgentCSV(agentData);
        }
        break;
      case 'trends':
        if (trendsData) {
          filename = `ticket-trends-${dateRange}days.csv`;
          csvContent = filterSummary + '\\n' + generateTrendsCSV(trendsData);
        }
        break;
      case 'lifecycle':
        if (lifecycleData) {
          filename = `ticket-lifecycle-${dateRange}days.csv`;
          csvContent = filterSummary + '\\n' + generateLifecycleCSV(lifecycleData);
        }
        break;
    }

    if (csvContent) {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reports & Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights about ticket performance and team productivity
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <SelectRoot value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="60">Last 60 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </SelectRoot>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {hasActiveFilters && (
                  <Button onClick={clearFilters} variant="ghost" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
                <Button onClick={handleExport} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Filter chips */}
            <div className="flex items-start gap-4 flex-wrap">
              {/* Priority Filters */}
              {availablePriorities.length > 0 && (
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Filter className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Priority</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availablePriorities.map(priority => (
                      <Badge
                        key={priority}
                        variant={selectedPriorities.includes(priority) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => togglePriority(priority)}
                      >
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Filters */}
              {availableCategories.length > 0 && (
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Filter className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Category</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map(category => (
                      <Badge
                        key={category}
                        variant={selectedCategories.includes(category) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleCategory(category)}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs value={activeReport} onValueChange={(value) => setActiveReport(value as ReportType)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sla">SLA Performance</TabsTrigger>
          <TabsTrigger value="agent">Agent Performance</TabsTrigger>
          <TabsTrigger value="trends">Ticket Trends</TabsTrigger>
          <TabsTrigger value="lifecycle">Lifecycle Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="sla" className="mt-6">
          <SLAPerformanceReport data={slaData} loading={loading} />
        </TabsContent>

        <TabsContent value="agent" className="mt-6">
          <AgentPerformanceReport data={agentData} loading={loading} />
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <TicketTrendsReport data={trendsData} loading={loading} />
        </TabsContent>

        <TabsContent value="lifecycle" className="mt-6">
          <TicketLifecycleReport data={lifecycleData} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// CSV Generation Functions
function generateSLACSV(data: any): string {
  let csv = 'SLA Performance Report\n\n';
  csv += 'Overall Compliance\n';
  csv += 'Total Tickets,Green,Yellow,Red,Compliance Rate\n';
  csv += `${data.overall.total_tickets},${data.overall.green_tickets},${data.overall.yellow_tickets},${data.overall.red_tickets},${data.overall.compliance_rate}%\n\n`;

  csv += 'By Priority\n';
  csv += 'Priority,Total,Green,Breached,Compliance Rate\n';
  data.byPriority.forEach((item: any) => {
    csv += `${item.priority},${item.total},${item.green},${item.breached},${item.compliance_rate}%\n`;
  });

  return csv;
}

function generateAgentCSV(data: any): string {
  let csv = 'Agent Performance Report\n\n';
  csv += 'Agent,Email,Total Assigned,Resolved,Open,SLA Met,SLA Breached,Avg Resolution (min),Avg First Response (min)\n';
  data.agentMetrics.forEach((agent: any) => {
    csv += `"${agent.name}",${agent.email},${agent.total_assigned},${agent.resolved_count},${agent.open_count},${agent.sla_met_count},${agent.sla_breached_count},${agent.avg_resolution_minutes || 'N/A'},${agent.avg_first_response_minutes || 'N/A'}\n`;
  });
  return csv;
}

function generateTrendsCSV(data: any): string {
  let csv = 'Ticket Trends Report\n\n';
  csv += 'Volume Trend\n';
  csv += 'Date,Created,Resolved\n';
  data.volumeTrend.forEach((item: any) => {
    const resolved = data.resolvedByDate.find((r: any) => r.date === item.date);
    csv += `${item.date},${item.created},${resolved?.resolved || 0}\n`;
  });

  csv += '\nTop Categories\n';
  csv += 'Category,Count,Percentage\n';
  data.topCategories.forEach((item: any) => {
    csv += `"${item.category}",${item.count},${item.percentage}%\n`;
  });

  return csv;
}

function generateLifecycleCSV(data: any): string {
  let csv = 'Ticket Lifecycle Report\n\n';
  csv += 'Resolution Statistics\n';
  csv += 'Total Resolved,Mean (min),Min (min),Max (min)\n';
  csv += `${data.resolutionStats.total_resolved},${data.resolutionStats.mean_minutes},${data.resolutionStats.min_minutes},${data.resolutionStats.max_minutes}\n\n`;

  csv += 'Time in Status\n';
  csv += 'Status,Avg Minutes\n';
  data.timeInStatus.forEach((item: any) => {
    csv += `${item.status},${item.avg_minutes || 'N/A'}\n`;
  });

  return csv;
}
