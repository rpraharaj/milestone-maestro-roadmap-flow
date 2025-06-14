
export interface Capability {
  id: string;
  name: string;
  workstreamLead: string;
  sme: string;
  ba: string;
  milestone: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  ragStatus: 'Red' | 'Amber' | 'Green';
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  name: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoadmapPlan {
  id: string;
  capabilityId: string;
  version: number;
  requirementStartDate: Date;
  requirementEndDate: Date;
  designStartDate: Date;
  designEndDate: Date;
  devStartDate: Date;
  devEndDate: Date;
  cstStartDate: Date;
  cstEndDate: Date;
  uatStartDate: Date;
  uatEndDate: Date;
  createdAt: Date;
  isActive: boolean;
}

export interface AppData {
  capabilities: Capability[];
  milestones: Milestone[];
  roadmapPlans: RoadmapPlan[];
}
