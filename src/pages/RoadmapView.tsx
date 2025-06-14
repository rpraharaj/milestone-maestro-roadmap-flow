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
  const timelineDefaultStart = startOfMonth(subMonths(now, 1));
  const timelineDefaultEnd = endOfMonth(addMonths(now, 11));

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

  const visibleTimelineStart = timelineDefaultStart;
  const visibleTimelineEnd = timelineDefaultEnd;
  const actualContentStart = timelineDefaultStart;
  const actualContentEnd = timelineDefaultEnd;

  const headerMonths = eachMonthOfInterval({ start: visibleTimelineStart, end: visibleTimelineEnd });
  const contentMonths = headerMonths;
  const timelineContentWidth = contentMonths.length * 120; // MONTH_WIDTH

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

  const columns = [
    { label: 'Capability', width: 192 },  // w-48
    { label: 'RAG', width: 48 },          // w-12
    { label: 'Status', width: 112 },      // w-28
    { label: '', width: 64 },             // w-16 (history icon)
  ];
  
  const rowHeight = 48;
  const TIMELINE_LEFT_WIDTH = 48 + 12 + 28 + 16; // 104px for fixed columns
  const MONTH_WIDTH = 120;

  return (
    <div className="space-y-6 flex flex-col">
      {allPlans.length > 0 ? (
        <Card className="overflow-hidden order-1">
          <CardHeader>
            <CardTitle className="text-lg">Project Timeline</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* HEADER ROW: fixed-cols (left) + months (right) */}
            <div className="flex w-full">
              {/* Fixed columns header */}
              <div
                className="z-10 bg-white border-r border-gray-200"
                style={{ minWidth: TIMELINE_LEFT_WIDTH, maxWidth: TIMELINE_LEFT_WIDTH }}
              >
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
              </div>
              {/* Timeline months header (right) */}
              <div
                className="flex-1"
                style={{ overflow: "hidden" }}
              >
                <div
                  className="flex"
                  style={{
                    minWidth: `${timelineContentWidth}px`,
                    width: `${timelineContentWidth}px`,
                    height: rowHeight,
                  }}
                >
                  {contentMonths.map((month) => (
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
            </div>
            {/* BODY ROWS: fixed-cols (left) + timeline bars (right, scrollable) */}
            <div className="flex w-full">
              {/* Fixed columns rows */}
              <TimelineFixedColumns
                capabilities={data.capabilities}
                getActiveRoadmapPlan={getActiveRoadmapPlan}
                getRoadmapHistory={getRoadmapHistory}
                showHistory={showHistory}
                onToggleHistory={(capabilityId) =>
                  setShowHistory((prev) => ({
                    ...prev,
                    [capabilityId]: !prev[capabilityId],
                  }))
                }
                leftWidth={TIMELINE_LEFT_WIDTH}
                columns={columns}
                rowHeight={rowHeight}
              />
              {/* Timeline scrollable plan bars (right) */}
              <div
                className="overflow-x-auto flex-1"
                style={{
                  minWidth: `${timelineContentWidth}px`,
                  maxWidth: `calc(100vw - ${TIMELINE_LEFT_WIDTH}px)`,
                }}
              >
                <VisualTimeline
                  capabilities={data.capabilities}
                  getActiveRoadmapPlan={getActiveRoadmapPlan}
                  getRoadmapHistory={getRoadmapHistory}
                  showHistory={showHistory}
                  phases={phases}
                  visibleTimelineStart={visibleTimelineStart}
                  visibleTimelineEnd={visibleTimelineEnd}
                  timelineContentWidth={timelineContentWidth}
                  MONTH_WIDTH={MONTH_WIDTH}
                  parsePlanDate={parsePlanDate}
                  getPhasePosition={getPhasePosition}
                  rowHeight={rowHeight}
                />
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
