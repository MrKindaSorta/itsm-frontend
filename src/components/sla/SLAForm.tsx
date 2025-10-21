import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SLARule } from '@/types/sla';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

interface SLAFormProps {
  rule?: SLARule | null;
  onSave: (rule: Omit<SLARule, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];
const CATEGORY_OPTIONS = ['Hardware', 'Software', 'Network', 'Account Access', 'Other'];

export default function SLAForm({ rule, onSave, onCancel }: SLAFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [firstResponseMinutes, setFirstResponseMinutes] = useState<number>(60);
  const [resolutionMinutes, setResolutionMinutes] = useState<number>(240);
  const [escalationEnabled, setEscalationEnabled] = useState(false);
  const [escalationAfterMinutes, setEscalationAfterMinutes] = useState<number>(120);
  const [escalationPriority, setEscalationPriority] = useState('High');
  const [departments, setDepartments] = useState<string[]>([]);
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(true);

  useEffect(() => {
    if (rule) {
      setName(rule.name);
      setDescription(rule.description || '');
      setEnabled(rule.enabled);
      setSelectedPriorities(rule.conditions.priority || []);
      setSelectedCategories(rule.conditions.category || []);
      setSelectedDepartments(rule.conditions.department || []);
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
        const response = await fetch(`${API_BASE}/api/departments/unique`);
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

  const toggleSelection = (value: string, current: string[], setter: (arr: string[]) => void) => {
    if (current.includes(value)) {
      setter(current.filter((v) => v !== value));
    } else {
      setter([...current, value]);
    }
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
              <Label className="text-xs text-muted-foreground mb-2 block">Priority</Label>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_OPTIONS.map((priority) => (
                  <Badge
                    key={priority}
                    variant={selectedPriorities.includes(priority) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleSelection(priority, selectedPriorities, setSelectedPriorities)}
                  >
                    {priority}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Category</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategories.includes(category) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleSelection(category, selectedCategories, setSelectedCategories)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

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
