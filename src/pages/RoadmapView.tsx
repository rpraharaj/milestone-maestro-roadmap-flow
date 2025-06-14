import { useState, useMemo, useRef, useEffect } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, MapPin } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, differenceInDays, addMonths, subMonths, min as dateMin, max as dateMax } from "date-fns";
import PhaseLegend from "@/components/roadmap/PhaseLegend";

const TIMELINE_LEFT_WIDTH = 48 + 12 + 28 + 16; // 104px for fixed columns

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

  const allPlans = useMemo(() => {
    const plans: Array<{ capability: any; plan: any; isActive: boolean }> = [];
    data.capabilities.forEach(capability => {
      const activePlan = getActiveRoadmapPlan(capability.id);
      if (activePlan) {
        plans.push({ capability, plan: activePlan, isActive: true });
      }
      if (showHistory[capability.id]) {
        const history = getRoadmapHistory(capability.id);
        history.slice(1).forEach(plan => {
          plans.push({ capability, plan, isActive: false });
        });
      }
    });
    return plans;
  }, [data.capabilities, showHistory, getActiveRoadmapPlan, getRoadmapHistory]);

  const visibleTimelineStart = timelineDefaultStart;
  const visibleTimelineEnd = timelineDefaultEnd;
  const actualContentStart = timelineDefaultStart;
  const actualContentEnd = timelineDefaultEnd;

  const headerMonths = eachMonthOfInterval({ start: visibleTimelineStart, end: visibleTimelineEnd });
  const contentMonths = headerMonths;

  const MONTH_WIDTH = 120;
  const TIMELINE_MIN_HEIGHT = 140;
  const timelineContentWidth = contentMonths.length * MONTH_WIDTH;

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
      width: `calc(${width}% )`
    };
  };

  // Use a single ref for the scroll area (months header and rows will sync scrolling)
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Scroll to current month (so that today is roughly in middle) on mount
  useEffect(() => {
    if (!timelineScrollRef.current) return;
    const currentMonthIndex = contentMonths.findIndex(m =>
      m.getFullYear() === now.getFullYear() && m.getMonth() === now.getMonth()
    );
    const scrollToPx = Math.max(0, (currentMonthIndex - 3) * MONTH_WIDTH);
    timelineScrollRef.current.scrollLeft = scrollToPx;
  }, [now, contentMonths.length]);

  // Sync the header (months row) and content horizontal scroll
  // (We only need one scrollable container for both)
  
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

  return (
    <div className="space-y-6 flex flex-col">
      {allPlans.length > 0 ? (
        <Card className="overflow-hidden order-1">
          <CardHeader>
            <CardTitle className="text-lg">Project Timeline</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Big flex row: left columns fixed, right timeline horizontally scrollable */}
            <div className="flex w-full">
              {/* Fixed left columns (header + rows) */}
              <div className="z-10 bg-white border-r border-gray-200" style={{ minWidth: TIMELINE_LEFT_WIDTH, maxWidth: TIMELINE_LEFT_WIDTH }}>
                {/* Header */}
                <div className="flex">
                  {columns.map(col => (
                    <div
                      key={col.label}
                      className="text-sm font-medium text-gray-600 flex items-center border-r last:border-r-0 border-gray-200 px-3"
                      style={{ minWidth: col.width, maxWidth: col.width, width: col.width, height: 48 }}
                    >
                      {col.label}
                    </div>
                  ))}
                </div>
                {/* Rows */}
                {data.capabilities.map(capability => {
                  const activePlan = getActiveRoadmapPlan(capability.id);
                  const history = getRoadmapHistory(capability.id);
                  const hasHistory = history.length > 1;
                  const plansToShow = [
                    ...(activePlan ? [{ plan: activePlan, isActive: true }] : []),
                    ...(showHistory[capability.id] ? history.slice(1).map(plan => ({ plan, isActive: false })) : [])
                  ];
                  if (plansToShow.length === 0) return null;
                  return plansToShow.map(({ plan, isActive }, planIndex) => (
                    <div
                      key={plan.id}
                      className="flex"
                      style={{
                        minWidth: TIMELINE_LEFT_WIDTH,
                        maxWidth: TIMELINE_LEFT_WIDTH,
                        width: TIMELINE_LEFT_WIDTH,
                        height: 48
                      }}
                    >
                      {/* Name column */}
                      <div className="w-48 flex items-center px-3 h-12 border-b border-gray-100">
                        <span className="font-medium truncate max-w-[8rem]" title={capability.name}>
                          {capability.name}
                        </span>
                        {!isActive && (
                          <span className="ml-2 text-xs text-gray-400 align-middle">v{plan.version}</span>
                        )}
                      </div>
                      {/* RAG column */}
                      <div className="w-12 flex items-center justify-center h-12 border-b border-gray-100">
                        {(() => {
                          let color = "bg-green-500";
                          if (capability.ragStatus === "Red") color = "bg-red-500";
                          else if (capability.ragStatus === "Amber") color = "bg-amber-400";
                          return (
                            <span className={`inline-block h-3 w-3 rounded-full ${color}`} title={capability.ragStatus} />
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
                            onClick={() =>
                              setShowHistory(prev => ({
                                ...prev,
                                [capability.id]: !prev[capability.id]
                              }))
                            }
                            className="h-8 w-8 p-0"
                            title={showHistory[capability.id] ? "Hide History" : "Show History"}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ));
                })}
              </div>
              {/* Scrollable timeline area (header for months + plan bars) */}
              <div className="flex-1 min-w-0 relative">
                {/* Timeline header and rows should scroll together (wrap in scrollable div) */}
                <div
                  className="overflow-x-auto"
                  style={{
                    minWidth: "100px",
                    maxWidth: "100%",
                  }}
                  ref={timelineScrollRef}
                  tabIndex={0} // for keyboard access
                >
                  {/* Timeline months (header row) */}
                  <div className="flex" style={{ minWidth: `${timelineContentWidth}px`, width: `${timelineContentWidth}px`, height: 48 }}>
                    {contentMonths.map(month => (
                      <div
                        key={month.toISOString()}
                        className="text-center text-sm font-medium text-gray-600 border-l border-gray-200 flex items-center justify-center bg-gray-50"
                        style={{
                          minWidth: `${MONTH_WIDTH}px`,
                          width: `${MONTH_WIDTH}px`,
                          height: 48
                        }}
                      >
                        {format(month, "MMM yyyy")}
                      </div>
                    ))}
                  </div>
                  {/* Timeline content (plan bars), for each visible capability+plan */}
                  {data.capabilities.map(capability => {
                    const activePlan = getActiveRoadmapPlan(capability.id);
                    const history = getRoadmapHistory(capability.id);
                    const plansToShow = [
                      ...(activePlan ? [{ plan: activePlan, isActive: true }] : []),
                      ...(showHistory[capability.id] ? history.slice(1).map(plan => ({ plan, isActive: false })) : [])
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
                          height: 48
                        }}
                      >
                        {/* Timeline bars for each plan */}
                        <div className="relative w-full h-12 flex items-center">
                          {phases.map(phase => {
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

// NOTE: This file is now even longer. You should consider asking to refactor RoadmapView.tsx to smaller components for maintainability!
