import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export default function Dashboard() {
  const metrics = [
    { title: 'New Tickets', value: '12', icon: Ticket, color: 'text-blue-600' },
    { title: 'High Priority', value: '5', icon: AlertTriangle, color: 'text-red-600' },
    { title: 'My Open Tickets', value: '18', icon: Clock, color: 'text-orange-600' },
    { title: 'Resolved Today', value: '7', icon: CheckCircle2, color: 'text-green-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's an overview of your ticket metrics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Recent ticket list will appear here...
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SLA Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tickets approaching SLA breach will appear here...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
