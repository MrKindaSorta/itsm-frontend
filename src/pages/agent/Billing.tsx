import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CreditCard, Download, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getApiBaseUrl } from '@/lib/api';

interface BillingInfo {
  plan: string;
  planPrice: number;
  status: string;
  trialEndsAt: number | null;
  currentPeriodEnd: number | null;
  createdAt: string;
}

interface Invoice {
  id: string;
  date: number;
  amount: number;
  currency: string;
  status: string;
  invoicePdf: string;
  hostedInvoiceUrl: string;
  description: string;
}

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    setIsLoading(true);
    try {
      const API_BASE = getApiBaseUrl();

      // Fetch billing info
      const billingResponse = await fetch(`${API_BASE}/api/billing/info`);
      const billingData = await billingResponse.json();

      if (billingData.success) {
        setBillingInfo(billingData.billing);
      }

      // Fetch invoices
      const invoicesResponse = await fetch(`${API_BASE}/api/billing/invoices`);
      const invoicesData = await invoicesResponse.json();

      if (invoicesData.success) {
        setInvoices(invoicesData.invoices);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load billing information',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsCreatingSession(true);
    try {
      const API_BASE = getApiBaseUrl();

      const response = await fetch(`${API_BASE}/api/billing/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Redirect to Stripe Customer Portal
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create portal session');
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      toast({
        title: 'Error',
        description: 'Failed to open billing portal. Please try again.',
        variant: 'destructive',
      });
      setIsCreatingSession(false);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      'active': { variant: 'default', label: 'Active' },
      'trialing': { variant: 'secondary', label: 'Trial' },
      'past_due': { variant: 'destructive', label: 'Past Due' },
      'cancelled': { variant: 'outline', label: 'Cancelled' },
    };

    const statusInfo = statusMap[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPlanName = (plan: string) => {
    const names: Record<string, string> = {
      'starter': 'Starter',
      'professional': 'Professional',
      'business': 'Business',
    };
    return names[plan] || plan;
  };

  const isInTrial = () => {
    if (!billingInfo?.trialEndsAt) return false;
    return Date.now() / 1000 < billingInfo.trialEndsAt;
  };

  const getTrialDaysRemaining = () => {
    if (!billingInfo?.trialEndsAt) return 0;
    const now = Date.now() / 1000;
    const daysRemaining = Math.ceil((billingInfo.trialEndsAt - now) / (60 * 60 * 24));
    return Math.max(0, daysRemaining);
  };

  // Check if user has permission (admin only for now)
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium">Access Denied</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Only administrators can access billing information.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription, payment method, and billing history
        </p>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Plan
            </CardTitle>
            <CardDescription>Your subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {billingInfo ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <span className="font-semibold">{getPlanName(billingInfo.plan)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="font-semibold">${billingInfo.planPrice}/month</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(billingInfo.status)}
                </div>

                {isInTrial() && (
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 dark:text-blue-100">
                          Trial Period Active
                        </p>
                        <p className="text-blue-700 dark:text-blue-300 mt-1">
                          {getTrialDaysRemaining()} days remaining in your free trial
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {billingInfo.currentPeriodEnd && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Next billing date</span>
                    <span className="text-sm">{formatDate(billingInfo.currentPeriodEnd)}</span>
                  </div>
                )}

                <Separator />

                <Button
                  onClick={handleManageSubscription}
                  disabled={isCreatingSession}
                  className="w-full"
                >
                  {isCreatingSession ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Opening portal...
                    </>
                  ) : (
                    <>
                      Manage Subscription
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Update payment method, change plan, or cancel subscription
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No billing information available</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>What you can do</CardTitle>
            <CardDescription>Manage your subscription settings</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Update your payment method</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>View and download invoices</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Upgrade or downgrade your plan</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Cancel your subscription anytime</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Update billing email and address</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Section */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View and download your past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Description</th>
                    <th className="text-left py-3 px-4 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-right py-3 px-4 font-medium">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4">{formatDate(invoice.date)}</td>
                      <td className="py-3 px-4">{invoice.description}</td>
                      <td className="py-3 px-4 font-medium">
                        {formatPrice(invoice.amount, invoice.currency)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(invoice.invoicePdf || invoice.hostedInvoiceUrl, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No invoices available yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
