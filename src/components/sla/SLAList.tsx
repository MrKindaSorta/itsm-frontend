import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SLARule } from '@/types/sla';
import type { FormConfiguration } from '@/types/formBuilder';
import { Clock, Edit, Trash2, AlertTriangle, AlertCircle } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';
const FORM_CONFIG_STORAGE_KEY = 'itsm-form-configuration';

interface SLAListProps {
  rules: SLARule[];
  onEdit: (rule: SLARule) => void;
  onDelete: (ruleId: string) => void;
  onToggleEnabled: (ruleId: string) => void;
}

export default function SLAList({ rules, onEdit, onDelete, onToggleEnabled }: SLAListProps) {
  const [hasPriorityField, setHasPriorityField] = useState(true);
  const [hasCategoryField, setHasCategoryField] = useState(true);

  // Check if priority/category fields are enabled in form configuration
  useEffect(() => {
    const loadFormConfig = async () => {
      try {
        // Try loading from API first
        const response = await fetchWithAuth(`${API_BASE}/api/config/form`);
        const data = await response.json();

        if (data.success && data.config.fields) {
          const fields = data.config.fields;
          setHasPriorityField(fields.some((f: any) => f.id === 'system-priority'));
          setHasCategoryField(fields.some((f: any) => f.id === 'system-category'));
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
          } catch (parseError) {
            console.error('Failed to parse localStorage config:', parseError);
          }
        }
      }
    };

    loadFormConfig();
  }, []);

  // Check if a rule references disabled fields
  const hasDisabledFieldConditions = (rule: SLARule): boolean => {
    const hasPriorityCondition = !!(rule.conditions.priority && rule.conditions.priority.length > 0);
    const hasCategoryCondition = !!(rule.conditions.category && rule.conditions.category.length > 0);

    return (hasPriorityCondition && !hasPriorityField) || (hasCategoryCondition && !hasCategoryField);
  };

  // Get warning message for disabled fields
  const getDisabledFieldsMessage = (rule: SLARule): string => {
    const disabledFields: string[] = [];

    if (rule.conditions.priority && rule.conditions.priority.length > 0 && !hasPriorityField) {
      disabledFields.push('Priority');
    }
    if (rule.conditions.category && rule.conditions.category.length > 0 && !hasCategoryField) {
      disabledFields.push('Category');
    }

    return `${disabledFields.join(' and ')} field${disabledFields.length > 1 ? 's are' : ' is'} disabled in the ticket form`;
  };
  const formatMinutes = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getConditionsSummary = (rule: SLARule): string => {
    const conditions: string[] = [];

    if (rule.conditions.priority?.length) {
      conditions.push(`Priority: ${rule.conditions.priority.join(', ')}`);
    }
    if (rule.conditions.category?.length) {
      conditions.push(`Category: ${rule.conditions.category.join(', ')}`);
    }
    if (rule.conditions.department?.length) {
      conditions.push(`Department: ${rule.conditions.department.join(', ')}`);
    }

    return conditions.length > 0 ? conditions.join(' • ') : 'All tickets';
  };

  if (rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg">
        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">No SLA rules configured yet</p>
        <p className="text-xs text-muted-foreground mt-2">
          Create your first rule to set response and resolution time targets
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rules.map((rule) => (
        <Card key={rule.id} className={!rule.enabled ? 'opacity-60' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{rule.name}</h3>
                  <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                    {rule.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                  {rule.escalation?.enabled && (
                    <Badge variant="outline" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Auto-escalate
                    </Badge>
                  )}
                  {hasDisabledFieldConditions(rule) && (
                    <Badge variant="outline" className="gap-1 border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300" title={getDisabledFieldsMessage(rule)}>
                      <AlertCircle className="h-3 w-3" />
                      Field Warning
                    </Badge>
                  )}
                </div>

                {rule.description && (
                  <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>
                )}

                {hasDisabledFieldConditions(rule) && (
                  <div className="mb-3 text-xs text-orange-600 bg-orange-50 dark:bg-orange-950 p-2 rounded border border-orange-200 dark:border-orange-800">
                    ⚠️ {getDisabledFieldsMessage(rule)}. This condition will be skipped.
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Applies to: </span>
                    <span className="font-medium">{getConditionsSummary(rule)}</span>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-muted-foreground">First Response:</span>
                      <span className="font-medium">{formatMinutes(rule.targets.firstResponseMinutes)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-500" />
                      <span className="text-muted-foreground">Resolution:</span>
                      <span className="font-medium">{formatMinutes(rule.targets.resolutionMinutes)}</span>
                    </div>
                  </div>

                  {rule.escalation?.enabled && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Escalation: </span>
                      <span className="font-medium">
                        After {formatMinutes(rule.escalation.afterMinutes)} → {rule.escalation.newPriority}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onToggleEnabled(rule.id)}
                  title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                  className="h-8 w-8"
                >
                  <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    rule.enabled ? 'bg-primary' : 'bg-muted'
                  }`}>
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      rule.enabled ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(rule)}
                  title="Edit rule"
                  className="h-8 w-8"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(rule.id)}
                  title="Delete rule"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
