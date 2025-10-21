import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Mail, User as UserIcon, Lock, Check, Building2, Shield, Phone, MapPin } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getInitials } from '@/lib/utils';
import { DepartmentCombobox } from '@/components/ui/department-combobox';
import { TeamCombobox } from '@/components/ui/team-combobox';
import { LocationCombobox } from '@/components/ui/location-combobox';
import { JobTitleCombobox } from '@/components/ui/job-title-combobox';
import { ManagerCombobox } from '@/components/ui/manager-combobox';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Personal info state
  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [team, setTeam] = useState(user?.team || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [mobilePhone, setMobilePhone] = useState(user?.mobile_phone || '');
  const [location, setLocation] = useState(user?.location || '');
  const [jobTitle, setJobTitle] = useState(user?.job_title || '');
  const [manager, setManager] = useState(user?.manager || '');

  // Notification preferences state
  const [emailEnabled, setEmailEnabled] = useState(user?.notificationPreferences?.emailEnabled ?? true);
  const [emailFrequency, setEmailFrequency] = useState<'immediate' | 'hourly' | 'daily'>(user?.notificationPreferences?.emailFrequency || 'immediate');
  const [notifyTicketUpdate, setNotifyTicketUpdate] = useState(true);
  const [notifyTicketAssigned, setNotifyTicketAssigned] = useState(true);
  const [notifyCommentAdded, setNotifyCommentAdded] = useState(true);
  const [notifyTicketResolved, setNotifyTicketResolved] = useState(true);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE}/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          department: department || null,
          team: team || null,
          phone: phone || null,
          mobile_phone: mobilePhone || null,
          location: location || null,
          job_title: jobTitle || null,
          manager: manager || null,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setErrorMessage(data.error || 'Failed to update profile');
        return;
      }

      // Update the user in AuthContext
      const updatedUser = {
        ...user,
        name,
        department: department || undefined,
        team: team || undefined,
        phone: phone || undefined,
        mobile_phone: mobilePhone || undefined,
        location: location || undefined,
        job_title: jobTitle || undefined,
        manager: manager || undefined,
      };
      updateUser(updatedUser);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Save personal info error:', error);
      setErrorMessage('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const notificationPreferences = {
        emailEnabled,
        emailFrequency,
        newTicketAssigned: notifyTicketAssigned,
        ticketUpdated: notifyTicketUpdate,
        ticketResolved: notifyTicketResolved,
        mentions: notifyCommentAdded,
      };

      const response = await fetch(`${API_BASE}/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationPreferences }),
      });

      const data = await response.json();

      if (!data.success) {
        setErrorMessage(data.error || 'Failed to update notifications');
        return;
      }

      // Update the user in AuthContext
      const updatedUser = {
        ...user,
        notificationPreferences,
      };
      updateUser(updatedUser);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Save notifications error:', error);
      setErrorMessage('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE}/api/users/${user.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();

      if (!data.success) {
        setErrorMessage(data.error || 'Failed to update password');
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Change password error:', error);
      setErrorMessage('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Profile Header with Avatar */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold flex-shrink-0">
              {user && getInitials(user.name)}
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-3">
              {/* Name & Title */}
              <div>
                <h1 className="text-2xl font-bold">{user?.name}</h1>
                {jobTitle && (
                  <p className="text-base text-muted-foreground mt-0.5">{jobTitle}</p>
                )}
                {!jobTitle && (
                  <p className="text-base text-muted-foreground mt-0.5">No job title set</p>
                )}
              </div>

              {/* Contact & Org Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                {/* Email */}
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </div>

                {/* Work Phone */}
                {phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{phone}</span>
                  </div>
                )}

                {/* Mobile Phone */}
                {mobilePhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{mobilePhone} (mobile)</span>
                  </div>
                )}

                {/* Department */}
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>{user?.department || department || 'No department'}</span>
                </div>

                {/* Team */}
                {team && (
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{team}</span>
                  </div>
                )}

                {/* Location */}
                {location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{location}</span>
                  </div>
                )}

                {/* Role */}
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="capitalize">{user?.role}</span>
                </div>

                {/* Manager */}
                {manager && (
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>Reports to {manager}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showSuccess && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Changes saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
          <AlertDescription className="text-red-800 dark:text-red-200">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Personal Info & Security */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePersonalInfo} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-9"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email}
                      disabled
                      className="bg-secondary h-9"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm">Work Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-9"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobilePhone" className="text-sm">Mobile Phone</Label>
                    <Input
                      id="mobilePhone"
                      type="tel"
                      value={mobilePhone}
                      onChange={(e) => setMobilePhone(e.target.value)}
                      className="h-9"
                      placeholder="(555) 987-6543"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm">Department</Label>
                    <DepartmentCombobox
                      value={department}
                      onChange={(value) => setDepartment(value)}
                      placeholder="Select or type department..."
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="team" className="text-sm">Team</Label>
                    <TeamCombobox
                      value={team}
                      onChange={(value) => setTeam(value)}
                      placeholder="Select or type team..."
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jobTitle" className="text-sm">Job Title</Label>
                    <JobTitleCombobox
                      value={jobTitle}
                      onChange={(value) => setJobTitle(value)}
                      placeholder="Select or type job title..."
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm">Office Location</Label>
                    <LocationCombobox
                      value={location}
                      onChange={(value) => setLocation(value)}
                      placeholder="Select or type location..."
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manager" className="text-sm">Manager</Label>
                    <ManagerCombobox
                      value={manager}
                      onChange={(value) => setManager(value)}
                      placeholder="Select or type manager..."
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm">Role</Label>
                    <Input
                      id="role"
                      value={user?.role}
                      disabled
                      className="bg-secondary capitalize h-9"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" size="sm" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                <CardTitle className="text-lg">Security</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="h-9"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-9"
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters long
                </p>

                <div className="flex justify-end pt-2">
                  <Button type="submit" size="sm" disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Notifications */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <CardTitle className="text-lg">Notifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveNotifications} className="space-y-4">
                {/* Email Toggle */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Email</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailEnabled}
                      onChange={(e) => setEmailEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                </div>

                {emailEnabled && (
                  <>
                    {/* Frequency */}
                    <div className="space-y-2">
                      <Label htmlFor="frequency" className="text-sm">Frequency</Label>
                      <Select
                        id="frequency"
                        value={emailFrequency}
                        onChange={(e) => setEmailFrequency(e.target.value as 'immediate' | 'hourly' | 'daily')}
                        className="h-9"
                      >
                        <option value="immediate">Immediate</option>
                        <option value="hourly">Hourly Digest</option>
                        <option value="daily">Daily Digest</option>
                      </Select>
                    </div>

                    {/* Notification Types */}
                    <div className="space-y-2">
                      <Label className="text-sm">Notify me when:</Label>

                      <div className="space-y-2">
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifyTicketUpdate}
                            onChange={(e) => setNotifyTicketUpdate(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Ticket updated</p>
                            <p className="text-xs text-muted-foreground">Status or priority changes</p>
                          </div>
                        </label>

                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifyTicketAssigned}
                            onChange={(e) => setNotifyTicketAssigned(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Ticket assigned</p>
                            <p className="text-xs text-muted-foreground">Agent assigned to ticket</p>
                          </div>
                        </label>

                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifyCommentAdded}
                            onChange={(e) => setNotifyCommentAdded(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">New comment</p>
                            <p className="text-xs text-muted-foreground">Agent replies received</p>
                          </div>
                        </label>

                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifyTicketResolved}
                            onChange={(e) => setNotifyTicketResolved(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Ticket resolved</p>
                            <p className="text-xs text-muted-foreground">Resolution completed</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end pt-2">
                  <Button type="submit" size="sm" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
