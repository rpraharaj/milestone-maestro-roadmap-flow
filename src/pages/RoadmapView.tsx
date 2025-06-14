import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, differenceInDays, addMonths, subMonths, min as dateMin, max as dateMax } from "date-fns";
import PhaseLegend from "@/components/roadmap/PhaseLegend";
import TimelineFixedColumns from "@/components/roadmap/TimelineFixedColumns";
import VisualTimeline from "@/components/roadmap/VisualTimeline";
import { useRoadmapPlanData } from "@/hooks/useRoadmapPlanData";

const TIMELINE_LEFT_WIDTH = 48 + 12 + 28 + 16; // 104px for fixed columns
const MONTH_WIDTH = 120;

export default function RoadmapView() {
  const { data, getActiveRoadmapPlan, getRoadmapHistory } = useData();
  const [showHistory, setShowHistory] = useState<Record<string, boolean>>({});
  const now = new Date();

  // Timeline: 1 month before, 11 after
  const timelineStart = startOfMonth(subMonths(now, 1));
  const timelineEnd = endOfMonth(addMonths(now, 11));
  const headerMonths = eachMonthOfInterval({ start: timelineStart, end: timelineEnd });

  // Plan data: only most recent (=active) plan unless history toggled (future: not implemented per row here)
  const plansWithCapability: Array<{ capability: any; plan: any }> = [];
  data.capabilities.forEach((cap) => {
    const activePlan = getActiveRoadmapPlan(cap.id);
    if (activePlan) {
      plansWithCapability.push({ capability: cap, plan: activePlan });
    }
    // Future: add older versions if showHistory[cap.id]
  });

  const timelineContentWidth = headerMonths.length * 120;
  const rowHeight = 48;
  const TIMELINE_LEFT_WIDTH = 192 + 48 + 112 + 64; // 416px (sum of all columns widths)
  const columns = [
    { label: 'Capability', width: 192 },  // w-48
    { label: 'RAG', width: 48 },          // w-12
    { label: 'Status', width: 112 },      // w-28
    { label: '', width: 64 },             // w-16 (history)
  ];
  const MONTH_WIDTH = 120;

  function parsePlanDate(val: unknown, fallback: Date = new Date()): Date {
    if (
      (typeof val === "string" && val) ||
      (typeof val === "number" && !isNaN(val)) ||
      val instanceof Date
    ) {
      return new Date(val as string | number | Date);
    }
    return fallback;
  }

  // Use refactored plan data hook
  const allPlans = useRoadmapPlanData({
    capabilities: data.capabilities,
    getActiveRoadmapPlan,
    getRoadmapHistory,
    showHistory,
  });

  const visibleTimelineStart = timelineStart;
  const visibleTimelineEnd = timelineEnd;
  const actualContentStart = timelineStart;
  const actualContentEnd = timelineEnd;

  // Clamp phase bar positions within the visible timeline (same logic as before)
  const getPhasePosition = (startDate: Date, endDate: Date) => {
    const clampedStart = dateMax([startDate, actualContentStart]);
    const clampedEnd = dateMin([endDate, actualContentEnd]);
    if (clampedEnd < clampedStart) {
      return { left: "0%", width: "0%" };
    }
    const startOffset = differenceInDays(clampedStart, actualContentStart);
    const duration = differenceInDays(clampedEnd, clampedStart);
    const totalDays = differenceInDays(actualContentEnd, actualContentStart);
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    return {
      left: `calc(${left}% )`,
      width: `calc(${width}% )`,
    };
  };

  const phases = [
    { key: 'requirement', label: 'REQ', color: 'bg-blue-500', startField: 'requirementStartDate', endField: 'requirementEndDate' },
    { key: 'design', label: 'DES', color: 'bg-purple-500', startField: 'designStartDate', endField: 'designEndDate' },
    { key: 'dev', label: 'DEV', color: 'bg-green-500', startField: 'devStartDate', endField: 'devEndDate' },
    { key: 'cst', label: 'CST', color: 'bg-orange-500', startField: 'cstStartDate', endField: 'cstEndDate' },
    { key: 'uat', label: 'UAT', color: 'bg-red-500', startField: 'uatStartDate', endField: 'uatEndDate' },
  ];

  // --- The layout ---
  return (
    <div className="space-y-6 flex flex-col">
      {plansWithCapability.length > 0 ? (
        <Card className="overflow-hidden order-1">
          <CardHeader>
            <CardTitle className="text-lg">Project Timeline</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex w-full">
              {/* Fixed columns area (fills the left edge, locks on scroll) */}
              <div
                className="z-10 bg-white border-r border-gray-200 flex flex-col"
                style={{ minWidth: TIMELINE_LEFT_WIDTH, maxWidth: TIMELINE_LEFT_WIDTH }}
              >
                {/* Header row */}
                <div className="flex" style={{ height: rowHeight }}>
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
                {/* Capability rows */}
                {plansWithCapability.map(({ capability, plan }) => {
                  // If you want to implement history, add below here
                  return (
                    <div key={capability.id} className="flex" style={{ height: rowHeight }}>
                      {/* Name column */}
                      <div className="w-48 flex items-center px-3 h-full border-b border-gray-100">
                        <span className="font-medium truncate max-w-[8rem]" title={capability.name}>
                          {capability.name}
                        </span>
                      </div>
                      {/* RAG column */}
                      <div className="w-12 flex items-center justify-center h-full border-b border-gray-100">
                        <span
                          className={`inline-block h-3 w-3 rounded-full ${
                            capability.ragStatus === "Red"
                              ? "bg-red-500"
                              : capability.ragStatus === "Amber"
                              ? "bg-amber-400"
                              : "bg-green-500"
                          }`}
                          title={capability.ragStatus}
                        />
                      </div>
                      {/* Status column */}
                      <div className="w-28 flex items-center h-full text-xs text-gray-600 border-b border-gray-100">
                        {capability.status}
                      </div>
                      {/* History icon column (not activated yet) */}
                      <div className="w-16 flex items-center justify-center h-full border-b border-gray-100"> </div>
                    </div>
                  );
                })}
              </div>
              {/* Timeline area (right) - horizontally scrolls */}
              <div
                className="overflow-x-auto flex-1"
                style={{
                  minWidth: `${timelineContentWidth}px`,
                  maxWidth: `calc(100vw - ${TIMELINE_LEFT_WIDTH}px)`,
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                {/* Grid: header + rows */}
                <div>
                  {/* Months header row */}
                  <div style={{ minWidth: `${timelineContentWidth}px` }}>
                    <div className="flex">
                      {headerMonths.map((month) => (
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
                  </div>
                  {/* Plan rows */}
                  {plansWithCapability.map(({ plan }) => (
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
                          const startDate = new Date(plan[phase.startField]);
                          const endDate = new Date(plan[phase.endField]);
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
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="order-1">
          <CardContent className="p-12 text-center">
            <div className="text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No roadmap data available</h3>
              <p className="text-sm">
                Create capabilities and their roadmap plans to see the visual timeline
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Legend BELOW timeline */}
      <Card className="order-2">
        <CardHeader>
          <CardTitle className="text-lg">Phase Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <PhaseLegend phases={phases} />
        </CardContent>
      </Card>
    </div>
  );
}
