
import React from "react";
import { RoadmapPlan, Capability } from "@/types";
import { addDays, format, isWithinInterval, isSameDay } from "date-fns";
import classNames from "clsx";

interface PhaseRange {
  label: string;
  color: string; // tailwind color bg
  start: Date;
  end: Date;
}

type Props = {
  capability: Capability;
  plan: RoadmapPlan;
  days: Date[];
  faded?: boolean; // for history
};

// Each plan phase will be highlighted with a certain background color.
const PHASES: { label: string; color: string; start: keyof RoadmapPlan; end: keyof RoadmapPlan }[] = [
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

// Determine for a given day if it's in a phase, and which one
function getPhaseForDay(plan: RoadmapPlan, day: Date) {
  for (let phase of PHASES) {
    if (
      isWithinInterval(day, {
        start: plan[phase.start],
        end: plan[phase.end],
      })
    ) {
      return phase;
    }
  }
  return null;
}

const RoadmapTimelineRow: React.FC<Props> = ({ capability, plan, days, faded }) => {
  return (
    <tr className={classNames(faded ? "opacity-60" : "bg-white hover:bg-gray-50", "transition-colors")}>
      <td className="whitespace-nowrap font-medium px-2 py-1 border-r border-gray-200 text-sm">
        {capability.name}
        {plan.version > 1 && (
          <span className="ml-2 text-xs text-gray-400 align-middle">v{plan.version}</span>
        )}
      </td>
      {days.map((day, idx) => {
        const phase = getPhaseForDay(plan, day);
        let cellClasses = "border border-gray-100 px-1 py-1 transition-all";
        if (phase) {
          cellClasses += ` ${phase.color} `;
        }
        if (isSameDay(day, new Date())) {
          cellClasses += " ring-2 ring-blue-400";
        }
        return (
          <td key={idx} className={cellClasses}>
            &nbsp;
          </td>
        );
      })}
    </tr>
  );
};

export default RoadmapTimelineRow;
