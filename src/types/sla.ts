export interface SLAConditions {
  priority?: string[];
  category?: string[];
  department?: string[];
  team?: string[];
  location?: string[];
  jobTitle?: string[];
  manager?: string[];
}

export interface SLATargets {
  firstResponseMinutes: number;
  resolutionMinutes: number;
}

export interface SLAEscalation {
  enabled: boolean;
  afterMinutes: number;
  newPriority: string;
}

export interface SLARule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  conditions: SLAConditions;
  targets: SLATargets;
  escalation?: SLAEscalation;
  createdAt: Date;
  updatedAt: Date;
}

export interface SLAConfiguration {
  rules: SLARule[];
  defaultRule?: SLARule;
}

export type SLAStatus = 'green' | 'yellow' | 'red';

export interface SLAIndicator {
  firstResponseDue: Date;
  resolutionDue: Date;
  firstResponseBreached: boolean;
  resolutionBreached: boolean;
  status: SLAStatus;
}
