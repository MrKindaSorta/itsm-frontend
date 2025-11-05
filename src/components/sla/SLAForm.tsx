import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SLARule } from '@/types/sla';
import type { FormConfiguration, FormField } from '@/types/formBuilder';
import { X, AlertTriangle, Loader2, Info } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';
const FORM_CONFIG_STORAGE_KEY = 'itsm-form-configuration';

interface SLAFormProps {
  rule?: SLARule | null;
  onSave: (rule: Omit<SLARule, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];
const CATEGORY_OPTIONS = ['Hardware', 'Software', 'Network', 'Account Access', 'Other'];

// Interface for custom form fields that can be used in SLA conditions
interface CustomSLAField {
  id: string;
  label: string;
  type: string;
  options?: string[]; // Optional for checkbox fields (they use checked/unchecked)
  enabled: boolean;
}

export default function SLAForm({ rule, onSave, onCancel }: SLAFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedJobTitles, setSelectedJobTitles] = useState<string[]>([]);
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
  const [firstResponseMinutes, setFirstResponseMinutes] = useState<number>(60);
  const [resolutionMinutes, setResolutionMinutes] = useState<number>(240);
  const [escalationEnabled, setEscalationEnabled] = useState(false);
  const [escalationAfterMinutes, setEscalationAfterMinutes] = useState<number>(120);
  const [escalationPriority, setEscalationPriority] = useState('High');
  const [departments, setDepartments] = useState<string[]>([]);
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(true);
  const [teams, setTeams] = useState<string[]>([]);
  const [isTeamsLoading, setIsTeamsLoading] = useState(true);
  const [locations, setLocations] = useState<string[]>([]);
  const [isLocationsLoading, setIsLocationsLoading] = useState(true);
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [isJobTitlesLoading, setIsJobTitlesLoading] = useState(true);
  const [managers, setManagers] = useState<string[]>([]);
  const [isManagersLoading, setIsManagersLoading] = useState(true);
  const [hasPriorityField, setHasPriorityField] = useState(true);
  const [hasCategoryField, setHasCategoryField] = useState(true);
  const [customFields, setCustomFields] = useState<CustomSLAField[]>([]);
  const [customFieldSelections, setCustomFieldSelections] = useState<Record<string, string[]>>({});

  // Check if priority/category fields are enabled in form configuration and load custom fields
  useEffect(() => {
    const loadFormConfig = async () => {
      try {
        // Try loading from API first
        const response = await fetchWithAuth(`${API_BASE}/api/config/form`);
        const data = await response.json();

        if (data.success && data.config.fields) {
          const fields: FormField[] = data.config.fields;
          setHasPriorityField(fields.some((f: FormField) => f.id === 'system-priority'));
          setHasCategoryField(fields.some((f: FormField) => f.id === 'system-category'));

          // Extract custom dropdown/multiselect/checkbox fields (excluding system priority/category)
          const customSLAFields = fields
            .filter((f: FormField) => {
              // Include checkbox fields
              if (f.type === 'checkbox') return true;

              // Include dropdown/multiselect with options
              return (f.type === 'dropdown' || f.type === 'multiselect') &&
                f.id !== 'system-priority' &&
                f.id !== 'system-category' &&
                f.options &&
                f.options.length > 0;
            })
            .map((f: FormField) => ({
              id: f.id,
              label: f.label,
              type: f.type,
              options: f.options, // Will be undefined for checkbox
              enabled: !f.hidden,
            }));

          setCustomFields(customSLAFields);
        } else {
          throw new Error('No fields in API response');
        }
      } catch (error) {
        console.error('Failed to load form configuration from API, using localStorage:', error);

        // Fallback to localStorage
        const saved = localStorage.getItem(FORM_CONFIG_STORAGE_KEY);
        if (saved) {
          try {
            const config: FormConfiguration = JSON.parse(saved);
            const fields = config.fields || [];
            setHasPriorityField(fields.some(f => f.id === 'system-priority'));
            setHasCategoryField(fields.some(f => f.id === 'system-category'));

            // Extract custom dropdown/multiselect/checkbox fields
            const customSLAFields = fields
              .filter(f => {
                // Include checkbox fields
                if (f.type === 'checkbox') return true;

                // Include dropdown/multiselect with options
                return (f.type === 'dropdown' || f.type === 'multiselect') &&
                  f.id !== 'system-priority' &&
                  f.id !== 'system-category' &&
                  f.options &&
                  f.options.length > 0;
              })
              .map(f => ({
                id: f.id,
                label: f.label,
                type: f.type,
                options: f.options, // Will be undefined for checkbox
                enabled: !f.hidden,
              }));

            setCustomFields(customSLAFields);
          } catch (parseError) {
            console.error('Failed to parse localStorage config:', parseError);
          }
        }
      }
    };

    loadFormConfig();
  }, []);

  useEffect(() => {
    if (rule) {
      setName(rule.name);
      setDescription(rule.description || '');
      setEnabled(rule.enabled);
      setSelectedPriorities(rule.conditions.priority || []);
      setSelectedCategories(rule.conditions.category || []);
      setSelectedDepartments(rule.conditions.department || []);
      setSelectedTeams(rule.conditions.team || []);
      setSelectedLocations(rule.conditions.location || []);
      setSelectedJobTitles(rule.conditions.jobTitle || []);
      setSelectedManagers(rule.conditions.manager || []);
      setCustomFieldSelections(rule.conditions.customFields || {});
      setFirstResponseMinutes(rule.targets.firstResponseMinutes);
      setResolutionMinutes(rule.targets.resolutionMinutes);
      setEscalationEnabled(rule.escalation?.enabled || false);
      setEscalationAfterMinutes(rule.escalation?.afterMinutes || 120);
      setEscalationPriority(rule.escalation?.newPriority || 'High');
    }
  }, [rule]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetchWithAuth(`${API_BASE}/api/departments/unique`);
        const data = await response.json();
        if (data.success) {
          setDepartments(data.departments || []);
        }
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      } finally {
        setIsDepartmentsLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetchWithAuth(`${API_BASE}/api/teams/unique`);
        const data = await response.json();
        if (data.success) {
          setTeams(data.teams || []);
        }
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      } finally {
        setIsTeamsLoading(false);
      }
    };
    fetchTeams();
  }, []);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetchWithAuth(`${API_BASE}/api/locations/unique`);
        const data = await response.json();
        if (data.success) {
          setLocations(data.locations || []);
        }
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      } finally {
        setIsLocationsLoading(false);
      }
    };
    fetchLocations();
  }, []);

  useEffect(() => {
    const fetchJobTitles = async () => {
      try {
        const response = await fetchWithAuth(`${API_BASE}/api/job-titles/unique`);
        const data = await response.json();
        if (data.success) {
          setJobTitles(data.jobTitles || []);
        }
      } catch (error) {
        console.error('Failed to fetch job titles:', error);
      } finally {
        setIsJobTitlesLoading(false);
      }
    };
    fetchJobTitles();
  }, []);

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const response = await fetchWithAuth(`${API_BASE}/api/managers/unique`);
        const data = await response.json();
        if (data.success) {
          setManagers(data.managers || []);
        }
      } catch (error) {
        console.error('Failed to fetch managers:', error);
      } finally {
        setIsManagersLoading(false);
      }
    };
    fetchManagers();
  }, []);

  const toggleSelection = (value: string, current: string[], setter: (arr: string[]) => void) => {
    if (current.includes(value)) {
      setter(current.filter((v) => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  const toggleCustomFieldSelection = (fieldId: string, value: string) => {
    setCustomFieldSelections(prev => {
      const current = prev[fieldId] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];

      // Remove field key if no selections
      if (updated.length === 0) {
        const { [fieldId]: _, ...rest } = prev;
        return rest;
      }

      return { ...prev, [fieldId]: updated };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSave({
      name,
      description: description || undefined,
      enabled,
      conditions: {
        priority: selectedPriorities.length > 0 ? selectedPriorities : undefined,
        category: selectedCategories.length > 0 ? selectedCategories : undefined,
        department: selectedDepartments.length > 0 ? selectedDepartments : undefined,
        team: selectedTeams.length > 0 ? selectedTeams : undefined,
        location: selectedLocations.length > 0 ? selectedLocations : undefined,
        jobTitle: selectedJobTitles.length > 0 ? selectedJobTitles : undefined,
        manager: selectedManagers.length > 0 ? selectedManagers : undefined,
        customFields: Object.keys(customFieldSelections).length > 0 ? customFieldSelections : undefined,
      },
      targets: {
        firstResponseMinutes,
        resolutionMinutes,
      },
      escalation: escalationEnabled
        ? {
            enabled: true,
            afterMinutes: escalationAfterMinutes,
            newPriority: escalationPriority,
          }
        : undefined,
    });
  };

  const isValid = name.trim().length > 0 && firstResponseMinutes > 0 && resolutionMinutes > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{rule ? 'Edit SLA Rule' : 'Create SLA Rule'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="rule-name">Rule Name *</Label>
              <Input
                id="rule-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., High Priority Response"
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="rule-description">Description</Label>
              <Input
                id="rule-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description of when this rule applies"
                className="mt-1.5"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <Label htmlFor="rule-enabled" className="font-medium">
                  Enable Rule
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Rule will be active and enforced
                </p>
              </div>
              <button
                type="button"
                id="rule-enabled"
                onClick={() => setEnabled(!enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enabled ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div>
              <Label className="text-sm font-medium mb-2 block">Conditions</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Select conditions for when this rule applies. Leave all empty to apply to all tickets.
              </p>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                Priority
                {!hasPriorityField && (
                  <span className="inline-flex items-center gap-1 text-orange-600" title="Priority field is disabled in the ticket form">
                    <Info className="h-3 w-3" />
                  </span>
                )}
              </Label>
              {!hasPriorityField && (
                <div className="mb-2 text-xs text-orange-600 bg-orange-50 dark:bg-orange-950 p-2 rounded border border-orange-200 dark:border-orange-800">
                  ⚠️ Priority field is disabled in the ticket form. Enable it in Form Builder to use this condition.
                </div>
              )}
              <div className={`flex flex-wrap gap-2 ${!hasPriorityField ? 'opacity-50 pointer-events-none' : ''}`}>
                {PRIORITY_OPTIONS.map((priority) => (
                  <Badge
                    key={priority}
                    variant={selectedPriorities.includes(priority) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => hasPriorityField && toggleSelection(priority, selectedPriorities, setSelectedPriorities)}
                  >
                    {priority}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                Category
                {!hasCategoryField && (
                  <span className="inline-flex items-center gap-1 text-orange-600" title="Category field is disabled in the ticket form">
                    <Info className="h-3 w-3" />
                  </span>
                )}
              </Label>
              {!hasCategoryField && (
                <div className="mb-2 text-xs text-orange-600 bg-orange-50 dark:bg-orange-950 p-2 rounded border border-orange-200 dark:border-orange-800">
                  ⚠️ Category field is disabled in the ticket form. Enable it in Form Builder to use this condition.
                </div>
              )}
              <div className={`flex flex-wrap gap-2 ${!hasCategoryField ? 'opacity-50 pointer-events-none' : ''}`}>
                {CATEGORY_OPTIONS.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategories.includes(category) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => hasCategoryField && toggleSelection(category, selectedCategories, setSelectedCategories)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Custom Dropdown/Multiselect Fields from Form Builder */}
            {customFields.map((customField) => (
              <div key={customField.id}>
                <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                  {customField.label}
                  {!customField.enabled && (
                    <span className="inline-flex items-center gap-1 text-orange-600" title={`${customField.label} field is disabled in the ticket form`}>
                      <Info className="h-3 w-3" />
                    </span>
                  )}
                </Label>
                {!customField.enabled && (
                  <div className="mb-2 text-xs text-orange-600 bg-orange-50 dark:bg-orange-950 p-2 rounded border border-orange-200 dark:border-orange-800">
                    ⚠️ {customField.label} field is disabled in the ticket form. Enable it in Form Builder to use this condition.
                  </div>
                )}
                <div className={`flex flex-wrap gap-2 ${!customField.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                  {customField.type === 'checkbox' ? (
                    // Checkbox fields: show Checked/Unchecked options
                    <>
                      <Badge
                        variant={(customFieldSelections[customField.id] || []).includes('true') ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => customField.enabled && toggleCustomFieldSelection(customField.id, 'true')}
                      >
                        Checked
                      </Badge>
                      <Badge
                        variant={(customFieldSelections[customField.id] || []).includes('false') ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => customField.enabled && toggleCustomFieldSelection(customField.id, 'false')}
                      >
                        Unchecked
                      </Badge>
                    </>
                  ) : (
                    // Dropdown/Multiselect fields: show their options
                    customField.options?.map((option) => (
                      <Badge
                        key={option}
                        variant={(customFieldSelections[customField.id] || []).includes(option) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => customField.enabled && toggleCustomFieldSelection(customField.id, option)}
                      >
                        {option}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            ))}

            {/* Divider between Ticket Fields and User Profile Fields */}
            {customFields.length > 0 && (
              <div className="pt-2 border-t border-border">
                <Label className="text-xs font-medium text-muted-foreground">User Profile Conditions</Label>
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Department</Label>
              {isDepartmentsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading departments...
                </div>
              ) : departments.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {departments.map((dept) => (
                    <Badge
                      key={dept}
                      variant={selectedDepartments.includes(dept) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleSelection(dept, selectedDepartments, setSelectedDepartments)}
                    >
                      {dept}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No departments found. Add departments to users first.
                </p>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Team</Label>
              {isTeamsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading teams...
                </div>
              ) : teams.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {teams.map((team) => (
                    <Badge
                      key={team}
                      variant={selectedTeams.includes(team) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleSelection(team, selectedTeams, setSelectedTeams)}
                    >
                      {team}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No teams found. Add teams to users first.
                </p>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Office Location</Label>
              {isLocationsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading locations...
                </div>
              ) : locations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {locations.map((location) => (
                    <Badge
                      key={location}
                      variant={selectedLocations.includes(location) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleSelection(location, selectedLocations, setSelectedLocations)}
                    >
                      {location}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No locations found. Add locations to users first.
                </p>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Job Title</Label>
              {isJobTitlesLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading job titles...
                </div>
              ) : jobTitles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {jobTitles.map((jobTitle) => (
                    <Badge
                      key={jobTitle}
                      variant={selectedJobTitles.includes(jobTitle) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleSelection(jobTitle, selectedJobTitles, setSelectedJobTitles)}
                    >
                      {jobTitle}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No job titles found. Add job titles to users first.
                </p>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Manager</Label>
              {isManagersLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading managers...
                </div>
              ) : managers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {managers.map((manager) => (
                    <Badge
                      key={manager}
                      variant={selectedManagers.includes(manager) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleSelection(manager, selectedManagers, setSelectedManagers)}
                    >
                      {manager}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No managers found. Add managers to users first.
                </p>
              )}
            </div>
          </div>

          {/* Targets */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div>
              <Label className="text-sm font-medium mb-2 block">Time Targets</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first-response" className="text-xs">
                  First Response (minutes) *
                </Label>
                <Input
                  id="first-response"
                  type="number"
                  min="1"
                  value={firstResponseMinutes}
                  onChange={(e) => setFirstResponseMinutes(parseInt(e.target.value) || 0)}
                  className="mt-1"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.floor(firstResponseMinutes / 60)}h {firstResponseMinutes % 60}m
                </p>
              </div>

              <div>
                <Label htmlFor="resolution" className="text-xs">
                  Resolution (minutes) *
                </Label>
                <Input
                  id="resolution"
                  type="number"
                  min="1"
                  value={resolutionMinutes}
                  onChange={(e) => setResolutionMinutes(parseInt(e.target.value) || 0)}
                  className="mt-1"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.floor(resolutionMinutes / 60)}h {resolutionMinutes % 60}m
                </p>
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground">
              <strong>Tip:</strong> 60 minutes = 1 hour, 480 minutes = 8 hours (1 business day)
            </div>
          </div>

          {/* Escalation */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="escalation-toggle" className="font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Auto-Escalation
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Automatically increase priority if not resolved in time
                </p>
              </div>
              <button
                type="button"
                id="escalation-toggle"
                onClick={() => setEscalationEnabled(!escalationEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  escalationEnabled ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    escalationEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {escalationEnabled && (
              <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-primary/20">
                <div>
                  <Label htmlFor="escalation-after" className="text-xs">
                    After (minutes)
                  </Label>
                  <Input
                    id="escalation-after"
                    type="number"
                    min="1"
                    value={escalationAfterMinutes}
                    onChange={(e) => setEscalationAfterMinutes(parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="escalation-priority" className="text-xs">
                    New Priority
                  </Label>
                  <select
                    id="escalation-priority"
                    value={escalationPriority}
                    onChange={(e) => setEscalationPriority(e.target.value)}
                    className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    {PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t border-border">
            <Button type="submit" disabled={!isValid}>
              {rule ? 'Update Rule' : 'Create Rule'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
