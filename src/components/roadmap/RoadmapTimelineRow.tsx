
import React from "react";
import { RoadmapPlan, Capability } from "@/types";
import { addDays, format, isWithinInterval, isSameDay } from "date-fns";
import classNames from "clsx";

type RoadmapPlanDateField =
  | "requirementStartDate"
  | "requirementEndDate"
  | "designStartDate"
  | "designEndDate"
  | "devStartDate"
  | "devEndDate"
  | "cstStartDate"
  | "cstEndDate"
  | "uatStartDate"
  | "uatEndDate";

interface PhaseRange {
  label: string;
  color: string;
  start: RoadmapPlanDateField;
  end: RoadmapPlanDateField;
}

type Props = {
  capability: Capability;
  plan: RoadmapPlan;
  days: Date[];
  faded?: boolean;
  isMobile?: boolean;
};

const PHASES: PhaseRange[] = [
  {
    label: "Requirements",
    color: "bg-blue-200",
    start: "requirementStartDate",
    end: "requirementEndDate",
  },
  {
    label: "Design",
    color: "bg-green-200",
    start: "designStartDate",
    end: "designEndDate",
  },
  {
    label: "Development",
    color: "bg-yellow-200",
    start: "devStartDate",
    end: "devEndDate",
  },
  {
    label: "CST",
    color: "bg-orange-200",
    start: "cstStartDate",
    end: "cstEndDate",
  },
  {
    label: "UAT",
    color: "bg-purple-200",
    start: "uatStartDate",
    end: "uatEndDate",
  }
];

function getPhaseForDay(plan: RoadmapPlan, day: Date) {
  for (let phase of PHASES) {
    const start = plan[phase.start];
    const end = plan[phase.end];
    if (start instanceof Date && end instanceof Date) {
      if (
        isWithinInterval(day, {
          start,
          end,
        })
      ) {
        return phase;
      }
    }
  }
  return null;
}

const RoadmapTimelineRow: React.FC<Props> = ({ 
  capability, 
  plan, 
  days, 
  faded, 
  isMobile = false 
}) => {
  return (
    <tr className={classNames(
      "transition-colors border-b border-gray-100",
      faded ? "opacity-60" : "bg-white hover:bg-gray-50",
      isMobile && "h-16"
    )}>
      <td className={classNames(
        "whitespace-nowrap font-medium border-r border-gray-200 sticky left-0 bg-white z-10",
        isMobile ? "px-3 py-2 text-sm" : "px-2 py-1 text-sm"
      )}>
        <div className="flex flex-col">
          <span className={classNames(
            "truncate",
            isMobile ? "max-w-[160px]" : "max-w-[120px]"
          )} title={capability.name}>
            {capability.name}
          </span>
          {plan.version > 1 && (
            <span className="text-xs text-gray-400 mt-0.5">
              v{plan.version}
            </span>
          )}
        </div>
      </td>
      {days.map((day, idx) => {
        const phase = getPhaseForDay(plan, day);
        const isToday = isSameDay(day, new Date());
        
        let cellClasses = classNames(
          "border border-gray-100 transition-all relative",
          isMobile ? "px-2 py-2 min-w-[60px]" : "px-1 py-1"
        );
        
        if (phase) {
          cellClasses += ` ${phase.color}`;
        }
        
        if (isToday) {
          cellClasses += " ring-2 ring-blue-400 ring-inset";
        }
        
        return (
          <td key={idx} className={cellClasses}>
            {/* Mobile: Show phase label on hover/touch */}
            {isMobile && phase && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black bg-opacity-75 text-white text-xs transition-opacity pointer-events-none">
                {phase.label}
              </div>
            )}
            <div className={isMobile ? "h-4" : "h-2"}>
              &nbsp;
            </div>
          </td>
        );
      })}
    </tr>
  );
};

export default RoadmapTimelineRow;
