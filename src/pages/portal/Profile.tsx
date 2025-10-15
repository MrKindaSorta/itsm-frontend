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

export default function Profile() {
  const { user } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);

  // Personal info state
  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [phone, setPhone] = useState('(555) 234-5678');
  const [mobilePhone, setMobilePhone] = useState('(555) 987-6543');
  const [location, setLocation] = useState('New York, NY - Building 5, Floor 3');
  const [jobTitle, setJobTitle] = useState('Senior Software Engineer');
  const [manager, setManager] = useState('Sarah Johnson');

  // Mock data - in production these would come from API
  const departmentOptions = [
    'Engineering',
    'Product',
    'Marketing',
    'Sales',
    'Customer Support',
    'HR',
    'Finance',
    'Operations',
    'IT',
    'Legal'
  ];

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

  const handleSavePersonalInfo = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saving personal info:', {
      name,
      department,
      phone,
      mobilePhone,
      location,
      jobTitle,
      manager
    });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saving notification preferences:', {
      emailEnabled,
      emailFrequency,
      notifyTicketUpdate,
      notifyTicketAssigned,
      notifyCommentAdded,
      notifyTicketResolved,
    });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    console.log('Changing password');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
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
                    <Select
                      id="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="h-9"
                    >
                      <option value="">Select a department</option>
                      {departmentOptions.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jobTitle" className="text-sm">Job Title</Label>
                    <Input
                      id="jobTitle"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="h-9"
                      placeholder="Senior Developer"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm">Office Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="h-9"
                      placeholder="New York, NY"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manager" className="text-sm">Manager</Label>
                    <Input
                      id="manager"
                      value={manager}
                      onChange={(e) => setManager(e.target.value)}
                      className="h-9"
                      placeholder="Jane Smith"
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
                  <Button type="submit" size="sm">Save Changes</Button>
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
                      minLength={8}
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
                  Password must be at least 8 characters long
                </p>

                <div className="flex justify-end pt-2">
                  <Button type="submit" size="sm">Update Password</Button>
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
                  <Button type="submit" size="sm">Save Preferences</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
