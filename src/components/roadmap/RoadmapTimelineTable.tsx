
import React, { useMemo } from "react";
import { Capability, RoadmapPlan } from "@/types";
import RoadmapTimelineRow from "./RoadmapTimelineRow";
import { addDays, isAfter, isBefore, format } from "date-fns";
import classNames from "clsx";

type Props = {
  capabilities: Capability[];
  getActiveRoadmapPlan: (capabilityId: string) => RoadmapPlan | undefined;
  getRoadmapHistory: (capabilityId: string) => RoadmapPlan[];
  showHistoryFor: string | null;
};

function getPlanDates(plans: RoadmapPlan[]): { min: Date; max: Date } | null {
  let min: Date | null = null;
  let max: Date | null = null;
  for (const plan of plans) {
    for (const k of [
      "requirementStartDate",
      "requirementEndDate",
      "designStartDate",
      "designEndDate",
      "devStartDate",
      "devEndDate",
      "cstStartDate",
      "cstEndDate",
      "uatStartDate",
      "uatEndDate",
    ] as const) {
      const date: Date = plan[k];
      if (!min || isBefore(date, min)) min = date;
      if (!max || isAfter(date, max)) max = date;
    }
  }
  return min && max ? { min, max } : null;
}

export const RoadmapTimelineTable: React.FC<Props> = ({
  capabilities,
  getActiveRoadmapPlan,
  getRoadmapHistory,
  showHistoryFor
}) => {
  // Gather all plans for timeline bounds.
  const allPlans = capabilities.flatMap(cap =>
    getRoadmapHistory(cap.id)
  ).filter(Boolean);

  const dateRange = useMemo(() => getPlanDates(allPlans), [allPlans]);
  const days: Date[] = useMemo(() => {
    if (!dateRange) return [];
    const res: Date[] = [];
    let current = dateRange.min;
    while (current <= dateRange.max) {
      res.push(current);
      current = addDays(current, 1);
    }
    return res;
  }, [dateRange]);

  if (!dateRange) {
    return <div className="text-gray-500 py-8 text-center">No roadmap plans found to construct timeline.</div>;
  }

  return (
    <table className="min-w-full border-collapse text-xs">
      <thead>
        <tr>
          <th className="sticky left-0 z-10 bg-white border-b px-2 py-1 text-left w-40">Capability</th>
          {days.map((day, idx) => (
            <th
              key={idx}
              className={classNames(
                "border border-gray-100 px-1 py-1 font-normal",
                isSameDay(day, new Date()) ? "bg-blue-50" : ""
              )}
            >
              {format(day, "MMM d")}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {capabilities.map(cap => {
          const activePlan = getActiveRoadmapPlan(cap.id);
          if (!activePlan) return null;

          const showingHistory = showHistoryFor === cap.id;
          const history = getRoadmapHistory(cap.id);

          return (
            <React.Fragment key={cap.id}>
              <RoadmapTimelineRow capability={cap} plan={activePlan} days={days} />
              {showingHistory && history.length > 1 && (
                history.slice(1).map(plan => (
                  <RoadmapTimelineRow
                    key={plan.id}
                    capability={cap}
                    plan={plan}
                    days={days}
                    faded
                  />
                ))
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
};

function isSameDay(a: Date, b: Date) {
  return format(a, "yyyy-MM-dd") === format(b, "yyyy-MM-dd");
}

export default RoadmapTimelineTable;
