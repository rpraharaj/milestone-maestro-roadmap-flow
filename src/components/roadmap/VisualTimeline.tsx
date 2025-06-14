
import React from "react";
import { format, eachMonthOfInterval } from "date-fns";

interface Phase {
  key: string;
  label: string;
  color: string;
  startField: string;
  endField: string;
}

interface Capability {
  id: string;
  name: string;
  ragStatus: string;
  status: string;
}
interface Plan {
  id: string;
  version: number;
  [key: string]: any;
}

interface VisualTimelineProps {
  plansWithCapability: Array<{ capability: Capability; plan: Plan }>;
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
  plansWithCapability,
  phases,
  visibleTimelineStart,
  visibleTimelineEnd,
  timelineContentWidth,
  MONTH_WIDTH,
  parsePlanDate,
  getPhasePosition,
  rowHeight = 48,
}) => {
  const months = eachMonthOfInterval({ start: visibleTimelineStart, end: visibleTimelineEnd });

  return (
    <div>
      {/* Timeline months header */}
      <div className="flex" style={{ minWidth: `${timelineContentWidth}px` }}>
        {months.map((month) => (
          <div
            key={month.toISOString()}
            className="text-center text-sm font-medium text-gray-600 border-l border-gray-200 flex items-center justify-center bg-gray-50"
            style={{
              minWidth: `${MONTH_WIDTH}px`,
              width: `${MONTH_WIDTH}px`,
              height: rowHeight,
            }}
          >
            {format(month, "MMM yyyy")}
          </div>
        ))}
      </div>
      {/* Plan timeline bars, one per plan row (1:1 to capabilities unless showHistory) */}
      {plansWithCapability.map(({ plan }, idx) => (
        <div
          key={plan.id}
          className="relative flex items-center"
          style={{
            minWidth: `${timelineContentWidth}px`,
            width: `${timelineContentWidth}px`,
            maxWidth: `${timelineContentWidth}px`,
            height: rowHeight,
          }}
        >
          {/* Timeline bars for this plan */}
          <div className="relative w-full h-7 flex items-center">
            {phases.map((phase) => {
              const startDate = parsePlanDate(plan[phase.startField]);
              const endDate = parsePlanDate(plan[phase.endField]);
              const position = getPhasePosition(startDate, endDate);
              return (
                <div
                  key={phase.key}
                  className={`absolute h-7 rounded ${phase.color} shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center`}
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
      ))}
    </div>
  );
};

export default VisualTimeline;

