
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { format } from "date-fns";
import React from "react";

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
  [key: string]: any;
  id: string;
  version: number;
}
interface TimelineRowProps {
  capability: Capability;
  plansToShow: { plan: Plan; isActive: boolean }[];
  showHistory: boolean;
  hasHistory: boolean;
  onToggleHistory: () => void;
  getPhasePosition: (startDate: Date, endDate: Date) => { left: string; width: string };
  parsePlanDate: (v: unknown) => Date;
  phases: Phase[];
}

function ragDot(ragStatus: string) {
  let color = "bg-green-500";
  if (ragStatus === "Red") color = "bg-red-500";
  else if (ragStatus === "Amber") color = "bg-amber-400";
  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${color}`}
      title={ragStatus}
    />
  );
}

export default function TimelineRow({
  capability,
  plansToShow,
  showHistory,
  hasHistory,
  onToggleHistory,
  getPhasePosition,
  parsePlanDate,
  phases,
}: TimelineRowProps) {
  // Layout: Columns for Name, RAG, Status, History, Timeline
  return (
    <div className="bg-white">
      {plansToShow.map(({ plan, isActive }, planIndex) => (
        <div
          key={plan.id}
          className={`flex items-stretch border-b border-gray-100 hover:bg-gray-50 ${
            !isActive ? "opacity-70" : ""
          }`}
        >
          {/* Name column */}
          <div className="w-48 flex items-center px-3">
            <span className="font-medium truncate max-w-[8rem]" title={capability.name}>
              {capability.name}
            </span>
            {!isActive && (
              <span className="ml-2 text-xs text-gray-400 align-middle">v{plan.version}</span>
            )}
          </div>
          {/* RAG column */}
          <div className="w-12 flex items-center justify-center">{ragDot(capability.ragStatus)}</div>
          {/* Status column */}
          <div className="w-28 flex items-center text-xs text-gray-600">{capability.status}</div>
          {/* History icon column (only show on first/main plan for this capability) */}
          <div className="w-16 flex items-center justify-center">
            {planIndex === 0 && hasHistory && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleHistory}
                className="h-8 w-8 p-0"
                title={showHistory ? "Hide History" : "Show History"}
              >
                <History className="h-4 w-4" />
              </Button>
            )}
          </div>
          {/* Timeline (phases bar) column with a vertical divider */}
          <div className="flex-1 relative h-10 px-2 min-w-0 border-l border-gray-200">
            <div className="relative h-full w-full">
              {phases.map(phase => {
                const startDate = parsePlanDate(plan[phase.startField]);
                const endDate = parsePlanDate(plan[phase.endField]);
                const position = getPhasePosition(startDate, endDate);
                return (
                  <div
                    key={phase.key}
                    className={`absolute h-7 rounded ${phase.color} ${isActive ? "" : "opacity-60"} shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                    style={{
                      left: position.left,
                      width: position.width,
                      top: "7px",
                    }}
                    title={`${phase.label}: ${format(startDate, "MMM dd")} - ${format(endDate, "MMM dd")}`}
                  >
                    <div className="text-xs text-white font-medium p-1 truncate">
                      {phase.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

