
import React, { useMemo } from "react";
import { Capability, RoadmapPlan } from "@/types";
import RoadmapTimelineRow from "./RoadmapTimelineRow";
import { addDays, isAfter, isBefore, format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();
  
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
    return (
      <div className="text-gray-500 py-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <span className="text-lg">📅</span>
          <span>No roadmap plans found to construct timeline.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Mobile-optimized scrollable container */}
      <div className={classNames(
        "overflow-x-auto",
        isMobile && "touch-pan-x"
      )} style={{ WebkitOverflowScrolling: 'touch' }}>
        <table className={classNames(
          "border-collapse",
          isMobile ? "text-sm min-w-full" : "min-w-full text-xs"
        )}>
          <thead>
            <tr>
              <th className={classNames(
                "sticky left-0 z-10 bg-white border-b text-left",
                isMobile ? "px-3 py-3 w-48" : "px-2 py-1 w-40"
              )}>
                Capability
              </th>
              {days.map((day, idx) => {
                const isToday = isSameDay(day, new Date());
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                
                return (
                  <th
                    key={idx}
                    className={classNames(
                      "border border-gray-100 font-normal",
                      isMobile ? "px-2 py-3 min-w-[60px]" : "px-1 py-1",
                      isToday && "bg-blue-50 border-blue-200",
                      isWeekend && "bg-gray-50"
                    )}
                  >
                    <div className="text-center">
                      <div className={isMobile ? "text-xs" : "text-xs"}>
                        {format(day, "MMM")}
                      </div>
                      <div className={classNames(
                        "font-medium",
                        isMobile ? "text-sm" : "text-xs",
                        isToday && "text-blue-600"
                      )}>
                        {format(day, "d")}
                      </div>
                      {isMobile && (
                        <div className="text-xs text-gray-400">
                          {format(day, "EEE")}
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
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
                  <RoadmapTimelineRow 
                    capability={cap} 
                    plan={activePlan} 
                    days={days} 
                    isMobile={isMobile}
                  />
                  {showingHistory && history.length > 1 && (
                    history.slice(1).map(plan => (
                      <RoadmapTimelineRow
                        key={plan.id}
                        capability={cap}
                        plan={plan}
                        days={days}
                        faded
                        isMobile={isMobile}
                      />
                    ))
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Mobile scroll indicator */}
      {isMobile && (
        <div className="flex justify-center mt-2">
          <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
            Swipe horizontally to view timeline
          </div>
        </div>
      )}
    </div>
  );
};

function isSameDay(a: Date, b: Date) {
  return format(a, "yyyy-MM-dd") === format(b, "yyyy-MM-dd");
}

export default RoadmapTimelineTable;
