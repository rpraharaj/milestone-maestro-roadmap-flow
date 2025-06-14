
import { useMemo } from "react";

// Extracted from RoadmapView types for reuse
export interface Capability {
  id: string;
  name: string;
  ragStatus: string;
  status: string;
}

export interface Plan {
  id: string;
  version: number;
  [key: string]: any;
}

// Types for the hook's params
interface UseRoadmapPlanDataParams {
  capabilities: Capability[];
  getActiveRoadmapPlan: (id: string) => Plan | undefined;
  getRoadmapHistory: (id: string) => Plan[];
  showHistory: Record<string, boolean>;
}

export function useRoadmapPlanData({
  capabilities,
  getActiveRoadmapPlan,
  getRoadmapHistory,
  showHistory,
}: UseRoadmapPlanDataParams) {
  // Compute "all plans currently visible" (active and toggled history-plans)
  const allPlans = useMemo(() => {
    const plans: Array<{ capability: Capability; plan: Plan; isActive: boolean }> = [];
    capabilities.forEach((capability) => {
      const activePlan = getActiveRoadmapPlan(capability.id);
      if (activePlan) {
        plans.push({ capability, plan: activePlan, isActive: true });
      }
      if (showHistory[capability.id]) {
        const history = getRoadmapHistory(capability.id);
        history.slice(1).forEach((plan) => {
          plans.push({ capability, plan, isActive: false });
        });
      }
    });
    return plans;
  }, [capabilities, showHistory, getActiveRoadmapPlan, getRoadmapHistory]);
  return allPlans;
}
