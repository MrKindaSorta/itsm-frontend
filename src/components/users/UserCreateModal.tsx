import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { SelectRoot as Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DepartmentCombobox } from '@/components/ui/department-combobox';
import { TeamCombobox } from '@/components/ui/team-combobox';
import { LocationCombobox } from '@/components/ui/location-combobox';
import { JobTitleCombobox } from '@/components/ui/job-title-combobox';
import { ManagerCombobox } from '@/components/ui/manager-combobox';
import { Loader2, Eye, EyeOff, ChevronRight, ChevronLeft } from 'lucide-react';
import { isValidEmail } from '@/lib/utils';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

interface UserCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UserCreateModal({ open, onOpenChange, onSuccess }: UserCreateModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    // Basic Info (Step 1 - Required)
    name: '',
    email: '',
    password: '',
    role: 'user',
    require_password_change: false,
    // Additional Info (Step 2 - Optional)
    department: '',
    team: '',
    phone: '',
    mobile_phone: '',
    location: '',
    job_title: '',
    manager: '',
  });

  const roles = [
    { value: 'user', label: 'User' },
    { value: 'agent', label: 'Agent' },
    { value: 'manager', label: 'Manager' },
    { value: 'admin', label: 'Admin' },
  ];

  const validateBasicInfo = () => {
    // Validate required fields
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      setError('All basic fields are required');
      return false;
    }

    // Validate email
    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Validate password
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    setError(null);
    return true;
  };

  const handleNext = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (validateBasicInfo()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only allow submission on step 2
    if (currentStep !== 2) {
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const payload = {
        // Basic info
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        require_password_change: formData.require_password_change,
        // Additional info (optional)
        department: formData.department || null,
        team: formData.team || null,
        phone: formData.phone || null,
        mobile_phone: formData.mobile_phone || null,
        location: formData.location || null,
        job_title: formData.job_title || null,
        manager: formData.manager || null,
      };

      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        // Reset form
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'user',
          require_password_change: false,
          department: '',
          team: '',
          phone: '',
          mobile_phone: '',
          location: '',
          job_title: '',
          manager: '',
        });
        setCurrentStep(1);
        onOpenChange(false);
        onSuccess();
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      console.error('Create user error:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setCurrentStep(1);
        setError(null);
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New User {currentStep === 1 ? '- Basic Information' : '- Additional Information'}</DialogTitle>
          <DialogDescription>
            {currentStep === 1
              ? 'Add a new user to the system. Fill in the required basic information.'
              : 'Optionally provide additional details about the user (all fields are optional).'}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            currentStep === 1
              ? 'bg-primary text-primary-foreground'
              : 'bg-green-500 text-white'
          }`}>
            1
          </div>
          <div className={`h-0.5 w-12 ${currentStep === 2 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            currentStep === 2
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}>
            2
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* STEP 1: Basic Information */}
          {currentStep === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  User will use this password to log in. Must be at least 6 characters.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  User: Submit tickets only • Agent: Work on tickets • Manager: Assign & close tickets • Admin: Full access
                </p>
              </div>

              <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                <Checkbox
                  id="require_password_change"
                  checked={formData.require_password_change}
                  onChange={(e) =>
                    setFormData({ ...formData, require_password_change: e.target.checked })
                  }
                  disabled={isLoading}
                />
                <div className="space-y-1 leading-none">
                  <Label
                    htmlFor="require_password_change"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Require password change on first login
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    User will be prompted to change their password after their first successful login
                  </p>
                </div>
              </div>
            </>
          )}

          {/* STEP 2: Additional Information */}
          {currentStep === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department (Optional)</Label>
                  <DepartmentCombobox
                    value={formData.department}
                    onChange={(value) => setFormData({ ...formData, department: value })}
                    placeholder="Select or type department..."
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">Start typing to see existing departments</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team">Team (Optional)</Label>
                  <TeamCombobox
                    value={formData.team}
                    onChange={(value) => setFormData({ ...formData, team: value })}
                    placeholder="Select or type team..."
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">Start typing to see existing teams</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Work Phone (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile_phone">Mobile Phone (Optional)</Label>
                  <Input
                    id="mobile_phone"
                    type="tel"
                    placeholder="(555) 987-6543"
                    value={formData.mobile_phone}
                    onChange={(e) => setFormData({ ...formData, mobile_phone: e.target.value })}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Office Location (Optional)</Label>
                <LocationCombobox
                  value={formData.location}
                  onChange={(value) => setFormData({ ...formData, location: value })}
                  placeholder="Select or type location..."
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">Start typing to see existing locations</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title (Optional)</Label>
                  <JobTitleCombobox
                    value={formData.job_title}
                    onChange={(value) => setFormData({ ...formData, job_title: value })}
                    placeholder="Select or type job title..."
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">Start typing to see existing job titles</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manager">Manager (Optional)</Label>
                  <ManagerCombobox
                    value={formData.manager}
                    onChange={(value) => setFormData({ ...formData, manager: value })}
                    placeholder="Select or type manager..."
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">Includes users with manager role</p>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
              {error}
            </div>
          )}

          <DialogFooter>
            {currentStep === 1 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isLoading}
                >
                  Next: Additional Info
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
