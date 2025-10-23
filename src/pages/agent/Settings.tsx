import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Loader2, Save, TestTube, ShieldCheck, Mail, Settings2, Lock, Users, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SettingsFormData, UserRole } from '@/types';

export default function Settings() {
  const { settings, isLoading: settingsLoading, updateSettings } = useSettings();
  const { user } = useAuth();
  const { canManageSettings } = usePermissions();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<SettingsFormData | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData({
        general: {
          allowPublicSignup: settings.allowPublicSignup,
          enableKnowledgeBase: settings.enableKnowledgeBase,
        },
        email: {
          emailDomain: settings.emailDomain || '',
          emailFromAddress: settings.emailFromAddress || '',
          emailFromName: settings.emailFromName,
          enableEmailNotifications: settings.enableEmailNotifications,
          enableEmailReplies: settings.enableEmailReplies,
        },
        security: {
          passwordMinLength: settings.passwordMinLength,
          passwordRequireUppercase: settings.passwordRequireUppercase,
          passwordRequireLowercase: settings.passwordRequireLowercase,
          passwordRequireNumbers: settings.passwordRequireNumbers,
          passwordRequireSpecial: settings.passwordRequireSpecial,
          passwordExpiryDays: settings.passwordExpiryDays,
          maxLoginAttempts: settings.maxLoginAttempts,
          lockoutDurationMinutes: settings.lockoutDurationMinutes,
          sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
          enable2FA: settings.enable2FA,
          forcePasswordChangeFirstLogin: settings.forcePasswordChangeFirstLogin,
        },
        permissions: settings.permissionMatrix,
      });
    }
  }, [settings]);

  if (!canManageSettings) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium">Access Denied</h3>
          <p className="text-sm text-muted-foreground mt-2">
            You don't have permission to manage system settings.
          </p>
        </div>
      </div>
    );
  }

  if (settingsLoading || !formData) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSave = async () => {
    if (!formData) return;

    setIsSaving(true);
    try {
      await updateSettings({
        ...formData.general,
        ...formData.email,
        ...formData.security,
        permissionMatrix: formData.permissions,
        updatedBy: user?.id ? Number(user.id) : undefined,
      });

      toast({
        title: 'Settings saved',
        description: 'System settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!user?.email) return;

    try {
      const response = await fetch('https://itsm-backend.joshua-r-klimek.workers.dev/api/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail: user.email }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Test Email',
          description: data.message || 'Test email sent successfully.',
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send test email.',
        variant: 'destructive',
      });
    }
  };

  // Helper to get permission description
  const getPermissionInfo = (permission: string) => {
    const descriptions: Record<string, { label: string; description: string }> = {
      'ticket:create': { label: 'Create Tickets', description: 'Submit new tickets to the system' },
      'ticket:view:own': { label: 'View Own Tickets', description: 'View tickets they created or are assigned to' },
      'ticket:view:all': { label: 'View All Tickets', description: 'Access and view any ticket in the system' },
      'ticket:edit': { label: 'Edit Tickets', description: 'Modify ticket details, status, and priority' },
      'ticket:delete': { label: 'Delete Tickets', description: 'Permanently delete tickets (use with caution)' },
      'ticket:assign': { label: 'Assign Tickets', description: 'Assign tickets to agents and teams' },
      'ticket:close': { label: 'Close Tickets', description: 'Mark tickets as closed and completed' },
      'ticket:resolve': { label: 'Resolve Tickets', description: 'Mark tickets as resolved' },
      'user:view': { label: 'View Users', description: 'Access user list and profiles' },
      'user:create': { label: 'Create Users', description: 'Add new users to the system' },
      'user:edit': { label: 'Edit Users', description: 'Modify user details and roles' },
      'user:delete': { label: 'Delete Users', description: 'Remove users from the system' },
      'settings:view': { label: 'View Settings', description: 'Access system settings pages' },
      'settings:edit': { label: 'Edit Settings', description: 'Modify system configuration' },
      'customize:view': { label: 'View Customization', description: 'Access customization options' },
      'customize:edit': { label: 'Edit Customization', description: 'Modify forms, fields, and branding' },
      'reports:view': { label: 'View Reports', description: 'Access analytics and reporting' },
      'reports:export': { label: 'Export Reports', description: 'Download report data as CSV/PDF' },
      'kb:view': { label: 'View Knowledge Base', description: 'Access knowledge base articles' },
      'kb:create': { label: 'Create KB Articles', description: 'Write new knowledge base articles' },
      'kb:edit': { label: 'Edit KB Articles', description: 'Modify existing articles' },
      'kb:delete': { label: 'Delete KB Articles', description: 'Remove knowledge base articles' },
      'dashboard:view': { label: 'View Dashboard', description: 'Access agent dashboard and metrics' }
    };
    return descriptions[permission] || { label: permission, description: 'Permission description not available' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Manage system-wide configuration and preferences</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                <CardTitle>General Settings</CardTitle>
              </div>
              <CardDescription>
                Configure core system features and default behaviors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Public Sign-up</Label>
                  <p className="text-sm text-muted-foreground">
                    When disabled, hides the sign-up link from the login page and prevents new user registrations
                  </p>
                </div>
                <Switch
                  checked={formData.general.allowPublicSignup}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, general: { ...formData.general, allowPublicSignup: checked } })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Knowledge Base</Label>
                  <p className="text-sm text-muted-foreground">Enable knowledge base articles and search functionality</p>
                </div>
                <Switch
                  checked={formData.general.enableKnowledgeBase}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, general: { ...formData.general, enableKnowledgeBase: checked } })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Integration Tab */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <CardTitle>Email Integration</CardTitle>
              </div>
              <CardDescription>
                Configure email settings using Cloudflare Email Routing and Workers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <HelpCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Cloudflare Email Setup Instructions:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>Add your domain to Cloudflare and configure DNS</li>
                      <li>Enable <span className="font-mono">Email Routing</span> in Cloudflare Dashboard</li>
                      <li>Add a catch-all route pointing to your Worker endpoint</li>
                      <li>Configure SendGrid or Mailgun for outbound emails via Worker</li>
                      <li>Set your verified sender address below</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="emailDomain">Email Domain</Label>
                  <Input
                    id="emailDomain"
                    placeholder="support.yourcompany.com"
                    value={formData.email.emailDomain}
                    onChange={(e) =>
                      setFormData({ ...formData, email: { ...formData.email, emailDomain: e.target.value } })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Domain configured in Cloudflare Email Routing
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailFromAddress">From Email Address</Label>
                  <Input
                    id="emailFromAddress"
                    type="email"
                    placeholder="support@yourcompany.com"
                    value={formData.email.emailFromAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, email: { ...formData.email, emailFromAddress: e.target.value } })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Verified sender for outgoing emails
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailFromName">From Name</Label>
                <Input
                  id="emailFromName"
                  placeholder="Support Team"
                  value={formData.email.emailFromName}
                  onChange={(e) =>
                    setFormData({ ...formData, email: { ...formData.email, emailFromName: e.target.value } })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Display name shown in recipient's inbox
                </p>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Send automatic ticket update emails
                    </p>
                  </div>
                  <Switch
                    checked={formData.email.enableEmailNotifications}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, email: { ...formData.email, enableEmailNotifications: checked } })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Replies</Label>
                    <p className="text-xs text-muted-foreground">
                      Users can reply to tickets via email
                    </p>
                  </div>
                  <Switch
                    checked={formData.email.enableEmailReplies}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, email: { ...formData.email, enableEmailReplies: checked } })
                    }
                  />
                </div>
              </div>

              <Button onClick={handleTestEmail} variant="outline" className="w-full">
                <TestTube className="mr-2 h-4 w-4" />
                Send Test Email to {user?.email}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                <CardTitle>Security Settings</CardTitle>
              </div>
              <CardDescription>
                Configure authentication and security policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Password Requirements</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="passwordMinLength">Minimum Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      min="6"
                      max="128"
                      value={formData.security.passwordMinLength}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: { ...formData.security, passwordMinLength: parseInt(e.target.value) || 6 },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passwordExpiryDays">Expiry (days, 0 = never)</Label>
                    <Input
                      id="passwordExpiryDays"
                      type="number"
                      min="0"
                      value={formData.security.passwordExpiryDays}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: { ...formData.security, passwordExpiryDays: parseInt(e.target.value) || 0 },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 mt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Require Uppercase</Label>
                    <Switch
                      checked={formData.security.passwordRequireUppercase}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, security: { ...formData.security, passwordRequireUppercase: checked } })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Require Lowercase</Label>
                    <Switch
                      checked={formData.security.passwordRequireLowercase}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, security: { ...formData.security, passwordRequireLowercase: checked } })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Require Numbers</Label>
                    <Switch
                      checked={formData.security.passwordRequireNumbers}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, security: { ...formData.security, passwordRequireNumbers: checked } })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Require Special Chars</Label>
                    <Switch
                      checked={formData.security.passwordRequireSpecial}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, security: { ...formData.security, passwordRequireSpecial: checked } })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Login Security</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      min="1"
                      max="20"
                      value={formData.security.maxLoginAttempts}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: { ...formData.security, maxLoginAttempts: parseInt(e.target.value) || 5 },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lockoutDuration">Lockout (minutes)</Label>
                    <Input
                      id="lockoutDuration"
                      type="number"
                      min="1"
                      max="1440"
                      value={formData.security.lockoutDurationMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: { ...formData.security, lockoutDurationMinutes: parseInt(e.target.value) || 15 },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (min)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      min="5"
                      max="43200"
                      value={formData.security.sessionTimeoutMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: { ...formData.security, sessionTimeoutMinutes: parseInt(e.target.value) || 480 },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Two-Factor Authentication</Label>
                      <p className="text-xs text-muted-foreground">Require 2FA for all users</p>
                    </div>
                    <Switch
                      checked={formData.security.enable2FA}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, security: { ...formData.security, enable2FA: checked } })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Force Password Change</Label>
                      <p className="text-xs text-muted-foreground">On first login only</p>
                    </div>
                    <Switch
                      checked={formData.security.forcePasswordChangeFirstLogin}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          security: { ...formData.security, forcePasswordChangeFirstLogin: checked },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permission Settings Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <CardTitle>Permission Settings</CardTitle>
              </div>
              <CardDescription>
                Configure role-based access control. Changes affect all users with selected roles immediately.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium min-w-[200px]">Permission</th>
                      <th className="p-3 text-center font-medium w-[80px]">User</th>
                      <th className="p-3 text-center font-medium w-[80px]">Agent</th>
                      <th className="p-3 text-center font-medium w-[80px]">Manager</th>
                      <th className="p-3 text-center font-medium w-[80px]">Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(formData.permissions).map(([permission, roles]) => {
                      const info = getPermissionInfo(permission);
                      return (
                        <tr key={permission} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="p-3">
                            <div className="space-y-0.5">
                              <div className="font-medium text-sm">{info.label}</div>
                              <div className="text-xs text-muted-foreground">{info.description}</div>
                            </div>
                          </td>
                          {(['user', 'agent', 'manager', 'admin'] as UserRole[]).map((role) => (
                            <td key={role} className="p-3 text-center">
                              <div className="flex justify-center">
                                <Switch
                                  checked={roles.includes(role)}
                                  onCheckedChange={(checked) => {
                                    const newRoles = checked
                                      ? [...roles, role]
                                      : roles.filter((r) => r !== role);
                                    setFormData({
                                      ...formData,
                                      permissions: {
                                        ...formData.permissions,
                                        [permission]: newRoles,
                                      },
                                    });
                                  }}
                                />
                              </div>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save button at bottom */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save All Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
