import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Loader2, Save, TestTube, ShieldCheck, Mail, Settings2, Lock, Users } from 'lucide-react';
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
          enableTimeTracking: settings.enableTimeTracking,
          enableAttachments: settings.enableAttachments,
          enableEmailToTicket: settings.enableEmailToTicket,
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

      <div className="space-y-4">
        {/* General Settings */}
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
                  Allow users to create accounts without admin approval
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

            <div className="space-y-4">
              <h4 className="font-medium">Feature Toggles</h4>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Time Tracking</Label>
                  <p className="text-sm text-muted-foreground">Allow agents to track time on tickets</p>
                </div>
                <Switch
                  checked={formData.general.enableTimeTracking}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, general: { ...formData.general, enableTimeTracking: checked } })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>File Attachments</Label>
                  <p className="text-sm text-muted-foreground">Allow file uploads on tickets</p>
                </div>
                <Switch
                  checked={formData.general.enableAttachments}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, general: { ...formData.general, enableAttachments: checked } })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email-to-Ticket</Label>
                  <p className="text-sm text-muted-foreground">Create tickets from incoming emails</p>
                </div>
                <Switch
                  checked={formData.general.enableEmailToTicket}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, general: { ...formData.general, enableEmailToTicket: checked } })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Knowledge Base</Label>
                  <p className="text-sm text-muted-foreground">Enable knowledge base articles</p>
                </div>
                <Switch
                  checked={formData.general.enableKnowledgeBase}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, general: { ...formData.general, enableKnowledgeBase: checked } })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Email Integration</CardTitle>
            </div>
            <CardDescription>
              Configure email settings for Cloudflare Email Workers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
              <p className="text-sm text-muted-foreground">
                Your domain configured in Cloudflare Email Routing
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
              <p className="text-sm text-muted-foreground">
                Email address for outgoing notifications
              </p>
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
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send email notifications for ticket updates
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
                <p className="text-sm text-muted-foreground">
                  Allow replying to tickets via email
                </p>
              </div>
              <Switch
                checked={formData.email.enableEmailReplies}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, email: { ...formData.email, enableEmailReplies: checked } })
                }
              />
            </div>

            <Button onClick={handleTestEmail} variant="outline" className="w-full">
              <TestTube className="mr-2 h-4 w-4" />
              Send Test Email
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
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

                <div className="flex items-center justify-between">
                  <Label>Require Uppercase Letters</Label>
                  <Switch
                    checked={formData.security.passwordRequireUppercase}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, security: { ...formData.security, passwordRequireUppercase: checked } })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Require Lowercase Letters</Label>
                  <Switch
                    checked={formData.security.passwordRequireLowercase}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, security: { ...formData.security, passwordRequireLowercase: checked } })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Require Numbers</Label>
                  <Switch
                    checked={formData.security.passwordRequireNumbers}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, security: { ...formData.security, passwordRequireNumbers: checked } })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Require Special Characters</Label>
                  <Switch
                    checked={formData.security.passwordRequireSpecial}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, security: { ...formData.security, passwordRequireSpecial: checked } })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordExpiryDays">Password Expiry (days)</Label>
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
                  <p className="text-sm text-muted-foreground">Set to 0 for no expiry</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-4">Login Security</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Maximum Login Attempts</Label>
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
                  <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
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
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
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

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
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
                    <Label>Force Password Change on First Login</Label>
                    <p className="text-sm text-muted-foreground">New users must change their password</p>
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

        {/* Permission Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Permission Settings</CardTitle>
            </div>
            <CardDescription>
              Configure role-based access control permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium">Permission</th>
                    <th className="p-3 text-center font-medium">User</th>
                    <th className="p-3 text-center font-medium">Agent</th>
                    <th className="p-3 text-center font-medium">Manager</th>
                    <th className="p-3 text-center font-medium">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(formData.permissions).map(([permission, roles]) => (
                    <tr key={permission} className="border-b last:border-0">
                      <td className="p-3 font-mono text-xs">{permission}</td>
                      {(['user', 'agent', 'manager', 'admin'] as UserRole[]).map((role) => (
                        <td key={role} className="p-3 text-center">
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
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Changes to permissions will affect all users with the selected roles immediately.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Save button at bottom */}
      <div className="flex justify-end">
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
