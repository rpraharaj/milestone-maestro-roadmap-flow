import React, { useRef, useEffect } from "react";
import { format, eachMonthOfInterval } from "date-fns";

interface Phase {
  key: string;
  label: string;
  color: string;
  startField: string;
  endField: string;
}

interface VisualTimelineProps {
  capabilities: any[];
  getActiveRoadmapPlan: (id: string) => any;
  getRoadmapHistory: (id: string) => any[];
  showHistory: Record<string, boolean>;
  phases: Phase[];
  visibleTimelineStart: Date;
  visibleTimelineEnd: Date;
  timelineContentWidth: number;
  MONTH_WIDTH: number;
  parsePlanDate: (val: unknown, fallback?: Date) => Date;
  getPhasePosition: (startDate: Date, endDate: Date) => { left: string; width: string };
  rowHeight?: number;
}

const VisualTimeline: React.FC<VisualTimelineProps> = ({
  capabilities,
  getActiveRoadmapPlan,
  getRoadmapHistory,
  showHistory,
  phases,
  visibleTimelineStart,
  visibleTimelineEnd,
  timelineContentWidth,
  MONTH_WIDTH,
  parsePlanDate,
  getPhasePosition,
  rowHeight = 48,
}) => {
  const now = new Date();
  const contentMonths = eachMonthOfInterval({ start: visibleTimelineStart, end: visibleTimelineEnd });
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Scroll to current month (so that today is roughly in middle) on mount
  useEffect(() => {
    if (!timelineScrollRef.current) return;
    const currentMonthIndex = contentMonths.findIndex(
      (m) => m.getFullYear() === now.getFullYear() && m.getMonth() === now.getMonth()
    );
    const scrollToPx = Math.max(0, (currentMonthIndex - 3) * MONTH_WIDTH);
    timelineScrollRef.current.scrollLeft = scrollToPx;
  }, [now, contentMonths.length, MONTH_WIDTH]);

  return (
    <div className="flex-1 min-w-0 relative" ref={timelineScrollRef}>
      {/* For every capability, render as many rows as plansToShow (active + optional history) */}
      {capabilities.map((capability) => {
        const activePlan = getActiveRoadmapPlan(capability.id);
        const history = getRoadmapHistory(capability.id);
        const plansToShow = [
          ...(activePlan ? [{ plan: activePlan, isActive: true }] : []),
          ...(showHistory[capability.id]
            ? history.slice(1).map((plan) => ({ plan, isActive: false }))
            : []),
        ];
        if (plansToShow.length === 0) return null;
        return plansToShow.map(({ plan, isActive }) => (
          <div
            className="relative flex items-center"
            key={plan.id}
            style={{
              minWidth: `${timelineContentWidth}px`,
              width: `${timelineContentWidth}px`,
              maxWidth: `${timelineContentWidth}px`,
              height: rowHeight,
            }}
          >
            {/* Timeline bars for each plan */}
            <div className="relative w-full h-7 flex items-center">
              {phases.map((phase) => {
                const startDate = parsePlanDate(plan[phase.startField]);
                const endDate = parsePlanDate(plan[phase.endField]);
                const position = getPhasePosition(startDate, endDate);
                return (
                  <div
                    key={phase.key}
                    className={`absolute h-7 rounded ${phase.color} ${isActive ? "" : "opacity-60"} shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center`}
                    style={{
                      left: position.left,
                      width: position.width,
                      top: 0,
                    }}
                    title={`${phase.label}: ${format(startDate, "MMM dd")} - ${format(endDate, "MMM dd")}`}
                  >
                    <div className="text-xs text-white font-medium p-1 truncate">{phase.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ));
      })}
    </div>
  );
};

export default VisualTimeline;
