import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SLARule } from '@/types/sla';
import { Clock, Edit, Trash2, AlertTriangle } from 'lucide-react';

interface SLAListProps {
  rules: SLARule[];
  onEdit: (rule: SLARule) => void;
  onDelete: (ruleId: string) => void;
  onToggleEnabled: (ruleId: string) => void;
}

export default function SLAList({ rules, onEdit, onDelete, onToggleEnabled }: SLAListProps) {
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
                </div>

                {rule.description && (
                  <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>
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
