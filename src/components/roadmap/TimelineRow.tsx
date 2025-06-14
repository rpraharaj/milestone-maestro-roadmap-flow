
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
  return (
    <div className="bg-white">
      {plansToShow.map(({ plan, isActive }, planIndex) => (
        <div key={plan.id} className="flex items-stretch py-4 hover:bg-gray-50">
          {/* Capability Column */}
          <div className="w-56 flex-shrink-0 px-4 flex flex-col justify-center">
            <div>
              <h3 className="font-medium text-gray-900 text-sm truncate max-w-[8rem]">
                {capability.name}
                {!isActive && (
                  <span className="text-xs text-gray-500 ml-2">v{plan.version}</span>
                )}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge
                  variant="outline"
                  className={
                    capability.ragStatus === 'Red' ? 'border-red-200 text-red-800 bg-red-50' :
                    capability.ragStatus === 'Amber' ? 'border-amber-200 text-amber-800 bg-amber-50' :
                    'border-green-200 text-green-800 bg-green-50'
                  }
                >
                  {capability.ragStatus}
                </Badge>
                <span className="text-xs text-gray-500">{capability.status}</span>
              </div>
              {/* Show/Hide History button row */}
              {planIndex === 0 && hasHistory && (
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleHistory}
                    className="text-xs w-full flex justify-start"
                  >
                    <History className="h-3 w-3 mr-1" />
                    {showHistory ? 'Hide' : 'Show'} History
                  </Button>
                </div>
              )}
            </div>
          </div>
          {/* Timeline Column */}
          <div className="flex-1 relative h-8 px-4 min-w-0">
            <div className="relative h-full w-full">
              {phases.map(phase => {
                const startDate = parsePlanDate(plan[phase.startField]);
                const endDate = parsePlanDate(plan[phase.endField]);
                const position = getPhasePosition(startDate, endDate);
                return (
                  <div
                    key={phase.key}
                    className={`absolute h-6 rounded ${phase.color} ${isActive ? '' : 'opacity-60'} shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                    style={{
                      left: position.left,
                      width: position.width,
                      top: '6px',
                    }}
                    title={`${phase.label}: ${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd')}`}
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
