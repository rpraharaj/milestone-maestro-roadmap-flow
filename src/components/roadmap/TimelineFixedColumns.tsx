
import React from "react";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";

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

interface TimelineFixedColumnsProps {
  capabilities: Capability[];
  getActiveRoadmapPlan: (id: string) => Plan | undefined;
  getRoadmapHistory: (id: string) => Plan[];
  showHistory: Record<string, boolean>;
  onToggleHistory: (capabilityId: string) => void;
  leftWidth: number;
  columns: Array<{ label: string; width: number }>;
  rowHeight?: number;
}

const TimelineFixedColumns: React.FC<TimelineFixedColumnsProps> = ({
  capabilities,
  getActiveRoadmapPlan,
  getRoadmapHistory,
  showHistory,
  onToggleHistory,
  leftWidth,
  columns,
  rowHeight = 48,
}) => {
  return (
    <div
      className="z-10 bg-white border-r border-gray-200"
      style={{ minWidth: leftWidth, maxWidth: leftWidth }}
    >
      {/* Header */}
      <div className="flex">
        {columns.map((col) => (
          <div
            key={col.label}
            className="text-sm font-medium text-gray-600 flex items-center border-r last:border-r-0 border-gray-200 px-3"
            style={{
              minWidth: col.width,
              maxWidth: col.width,
              width: col.width,
              height: rowHeight,
            }}
          >
            {col.label}
          </div>
        ))}
      </div>
      {/* Rows */}
      {capabilities.map((capability) => {
        const activePlan = getActiveRoadmapPlan(capability.id);
        const history = getRoadmapHistory(capability.id);
        const hasHistory = history.length > 1;
        const plansToShow = [
          ...(activePlan
            ? [{ plan: activePlan, isActive: true }]
            : []),
          ...(showHistory[capability.id]
            ? history.slice(1).map((plan) => ({ plan, isActive: false }))
            : []),
        ];
        if (plansToShow.length === 0) return null;
        return plansToShow.map(({ plan, isActive }, planIndex) => (
          <div
            key={plan.id}
            className="flex"
            style={{
              minWidth: leftWidth,
              maxWidth: leftWidth,
              width: leftWidth,
              height: rowHeight,
            }}
          >
            {/* Name column */}
            <div className="w-48 flex items-center px-3 h-12 border-b border-gray-100">
              <span
                className="font-medium truncate max-w-[8rem]"
                title={capability.name}
              >
                {capability.name}
              </span>
              {!isActive && (
                <span className="ml-2 text-xs text-gray-400 align-middle">
                  v{plan.version}
                </span>
              )}
            </div>
            {/* RAG column */}
            <div className="w-12 flex items-center justify-center h-12 border-b border-gray-100">
              {(() => {
                let color = "bg-green-500";
                if (capability.ragStatus === "Red") color = "bg-red-500";
                else if (capability.ragStatus === "Amber")
                  color = "bg-amber-400";
                return (
                  <span
                    className={`inline-block h-3 w-3 rounded-full ${color}`}
                    title={capability.ragStatus}
                  />
                );
              })()}
            </div>
            {/* Status column */}
            <div className="w-28 flex items-center h-12 text-xs text-gray-600 border-b border-gray-100">
              {capability.status}
            </div>
            {/* History icon column */}
            <div className="w-16 flex items-center justify-center h-12 border-b border-gray-100">
              {planIndex === 0 && hasHistory && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onToggleHistory(capability.id)}
                  className="h-8 w-8 p-0"
                  title={
                    showHistory[capability.id]
                      ? "Hide History"
                      : "Show History"
                  }
                >
                  <History className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ));
      })}
    </div>
  );
};

export default TimelineFixedColumns;
