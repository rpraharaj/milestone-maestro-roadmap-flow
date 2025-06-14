

import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, History } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, differenceInDays, addMonths, subMonths, min as dateMin, max as dateMax } from "date-fns";
import PhaseLegend from "@/components/roadmap/PhaseLegend";
import TimelineFixedColumns from "@/components/roadmap/TimelineFixedColumns";
import VisualTimeline from "@/components/roadmap/VisualTimeline";
import { useRoadmapPlanData } from "@/hooks/useRoadmapPlanData";

const TIMELINE_LEFT_WIDTH = 416; // Sum of all column widths
const MONTH_WIDTH = 120;
const ROW_HEIGHT = 48;

const columns = [
  { label: 'Capability', width: 192 },
  { label: 'RAG', width: 48 },
  { label: 'Status', width: 112 },
  { label: 'History', width: 64 },
];

export default function RoadmapView() {
  const { data, getActiveRoadmapPlan, getRoadmapHistory } = useData();
  const [showHistory, setShowHistory] = useState<Record<string, boolean>>({});
  const now = new Date();

  // Get all plans to determine the full scrollable date range
  const getAllPlanDates = () => {
    const dates: Date[] = [];
    data.capabilities.forEach((cap) => {
      const activePlan = getActiveRoadmapPlan(cap.id);
      if (activePlan) {
        // Add all plan dates
        const planDates = [
          activePlan.requirementStartDate,
          activePlan.requirementEndDate,
          activePlan.designStartDate,
          activePlan.designEndDate,
          activePlan.devStartDate,
          activePlan.devEndDate,
          activePlan.cstStartDate,
          activePlan.cstEndDate,
          activePlan.uatStartDate,
          activePlan.uatEndDate,
        ].filter(date => date instanceof Date);
        dates.push(...planDates);
      }
      
      // Also include historical plan dates if history is shown
      if (showHistory[cap.id]) {
        const history = getRoadmapHistory(cap.id);
        history.slice(1).forEach((historicalPlan) => {
          const historicalDates = [
            historicalPlan.requirementStartDate,
            historicalPlan.requirementEndDate,
            historicalPlan.designStartDate,
            historicalPlan.designEndDate,
            historicalPlan.devStartDate,
            historicalPlan.devEndDate,
            historicalPlan.cstStartDate,
            historicalPlan.cstEndDate,
            historicalPlan.uatStartDate,
            historicalPlan.uatEndDate,
          ].filter(date => date instanceof Date);
          dates.push(...historicalDates);
        });
      }
    });
    return dates;
  };

  // Calculate the full scrollable timeline bounds (for scroll area)
  const calculateFullTimelineBounds = () => {
    const allPlanDates = getAllPlanDates();
    
    // Always include the default view range
    let timelineStart = startOfMonth(subMonths(now, 1));
    let timelineEnd = endOfMonth(addMonths(now, 11));
    
    if (allPlanDates.length > 0) {
      const earliestPlanDate = dateMin(allPlanDates);
      const latestPlanDate = dateMax(allPlanDates);
      
      // Extend timeline to include all plan dates with some padding
      const earliestMonth = startOfMonth(subMonths(earliestPlanDate, 1));
      const latestMonth = endOfMonth(addMonths(latestPlanDate, 1));
      
      // Only extend beyond default range if plans exist outside it
      timelineStart = dateMin([timelineStart, earliestMonth]);
      timelineEnd = dateMax([timelineEnd, latestMonth]);
    }
    
    return { timelineStart, timelineEnd };
  };

  // Default visible timeline (current month + 1 before + 11 after)
  const defaultVisibleStart = startOfMonth(subMonths(now, 1));
  const defaultVisibleEnd = endOfMonth(addMonths(now, 11));
  
  // Full scrollable timeline (includes all historical data)
  const { timelineStart: fullTimelineStart, timelineEnd: fullTimelineEnd } = calculateFullTimelineBounds();
  
  // Use full timeline for the scrollable area
  const headerMonths = eachMonthOfInterval({ start: fullTimelineStart, end: fullTimelineEnd });
  const timelineContentWidth = headerMonths.length * MONTH_WIDTH;

  // Calculate initial scroll position to show default view
  const defaultViewMonths = eachMonthOfInterval({ start: defaultVisibleStart, end: defaultVisibleEnd });
  const monthsBeforeDefault = eachMonthOfInterval({ start: fullTimelineStart, end: subMonths(defaultVisibleStart, 1) });
  const initialScrollLeft = monthsBeforeDefault.length * MONTH_WIDTH;

  const toggleHistory = (capabilityId: string) => {
    setShowHistory(prev => ({
      ...prev,
      [capabilityId]: !prev[capabilityId]
    }));
  };

  // Get plans with capability data (only active plans unless history is toggled)
  const plansWithCapability: Array<{ capability: any; plan: any; isActive: boolean }> = [];
  data.capabilities.forEach((cap) => {
    const activePlan = getActiveRoadmapPlan(cap.id);
    if (activePlan) {
      plansWithCapability.push({ capability: cap, plan: activePlan, isActive: true });
    }
    
    // Add historical plans if history is toggled for this capability
    if (showHistory[cap.id]) {
      const history = getRoadmapHistory(cap.id);
      history.slice(1).forEach((plan) => {
        plansWithCapability.push({ capability: cap, plan, isActive: false });
      });
    }
  });

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

  const getPhasePosition = (startDate: Date, endDate: Date) => {
    const clampedStart = dateMax([startDate, fullTimelineStart]);
    const clampedEnd = dateMin([endDate, fullTimelineEnd]);
    if (clampedEnd < clampedStart) {
      return { left: "0%", width: "0%" };
    }
    const startOffset = differenceInDays(clampedStart, fullTimelineStart);
    const duration = differenceInDays(clampedEnd, clampedStart);
    const totalDays = differenceInDays(fullTimelineEnd, fullTimelineStart);
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    return {
      left: `${left}%`,
      width: `${width}%`,
    };
  };

  const phases = [
    { key: 'requirement', label: 'REQ', color: 'bg-blue-500', startField: 'requirementStartDate', endField: 'requirementEndDate' },
    { key: 'design', label: 'DES', color: 'bg-purple-500', startField: 'designStartDate', endField: 'designEndDate' },
    { key: 'dev', label: 'DEV', color: 'bg-green-500', startField: 'devStartDate', endField: 'devEndDate' },
    { key: 'cst', label: 'CST', color: 'bg-orange-500', startField: 'cstStartDate', endField: 'cstEndDate' },
    { key: 'uat', label: 'UAT', color: 'bg-red-500', startField: 'uatStartDate', endField: 'uatEndDate' },
  ];

  return (
    <div className="space-y-6 flex flex-col">
      {plansWithCapability.length > 0 ? (
        <Card className="overflow-hidden order-1">
          <CardHeader>
            <CardTitle className="text-lg">Project Timeline</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex">
              {/* Fixed Columns */}
              <div 
                className="flex-shrink-0 bg-white border-r border-gray-200"
                style={{ width: TIMELINE_LEFT_WIDTH }}
              >
                {/* Header Row */}
                <div className="flex border-b border-gray-200 bg-gray-50" style={{ height: ROW_HEIGHT }}>
                  {columns.map((col) => (
                    <div
                      key={col.label}
                      className="flex items-center justify-center text-sm font-medium text-gray-600 border-r border-gray-200 last:border-r-0"
                      style={{ width: col.width, height: ROW_HEIGHT }}
                    >
                      {col.label}
                    </div>
                  ))}
                </div>
                
                {/* Data Rows */}
                {data.capabilities.map((capability) => {
                  const activePlan = getActiveRoadmapPlan(capability.id);
                  const history = getRoadmapHistory(capability.id);
                  const hasHistory = history.length > 1;
                  const plansToShow = showHistory[capability.id] 
                    ? [activePlan, ...history.slice(1)].filter(Boolean)
                    : activePlan ? [activePlan] : [];
                  
                  return plansToShow.map((plan, planIndex) => {
                    const isActive = planIndex === 0;
                    return (
                      <div key={`${capability.id}-${plan.id}`} className="flex border-b border-gray-100" style={{ height: ROW_HEIGHT }}>
                        {/* Capability Name with Version */}
                        <div className="flex items-center px-3 border-r border-gray-200" style={{ width: columns[0].width }}>
                          <span className="font-medium truncate" title={capability.name}>
                            {capability.name}
                          </span>
                          {plan && (
                            <span className="ml-2 text-xs text-gray-500 font-normal">
                              v{plan.version}
                            </span>
                          )}
                        </div>
                        
                        {/* RAG Status */}
                        <div className="flex items-center justify-center border-r border-gray-200" style={{ width: columns[1].width }}>
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
                        
                        {/* Status */}
                        <div className="flex items-center px-3 text-xs text-gray-600 border-r border-gray-200" style={{ width: columns[2].width }}>
                          {capability.status}
                        </div>
                        
                        {/* History Toggle */}
                        <div className="flex items-center justify-center" style={{ width: columns[3].width }}>
                          {isActive && hasHistory && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleHistory(capability.id)}
                              className="h-8 w-8 p-0"
                              title={showHistory[capability.id] ? "Hide History" : "Show History"}
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })}
              </div>

              {/* Visual Timeline */}
              <div 
                className="flex-1 overflow-x-auto"
                style={{ 
                  scrollBehavior: 'smooth',
                }}
                ref={(ref) => {
                  if (ref && initialScrollLeft > 0) {
                    // Set initial scroll position to show default view
                    setTimeout(() => {
                      ref.scrollLeft = initialScrollLeft;
                    }, 100);
                  }
                }}
              >
                <div style={{ minWidth: timelineContentWidth }}>
                  {/* Timeline Header */}
                  <div className="flex border-b border-gray-200 bg-gray-50" style={{ height: ROW_HEIGHT }}>
                    {headerMonths.map((month) => (
                      <div
                        key={month.toISOString()}
                        className="flex items-center justify-center text-sm font-medium text-gray-600 border-l border-gray-200 first:border-l-0"
                        style={{ width: MONTH_WIDTH, height: ROW_HEIGHT }}
                      >
                        {format(month, "MMM yyyy")}
                      </div>
                    ))}
                  </div>
                  
                  {/* Timeline Rows */}
                  {plansWithCapability.map(({ capability, plan, isActive }) => (
                    <div
                      key={`${capability.id}-${plan.id}`}
                      className="relative border-b border-gray-100"
                      style={{ height: ROW_HEIGHT, minWidth: timelineContentWidth }}
                    >
                      <div className="relative w-full h-full flex items-center px-2">
                        {phases.map((phase) => {
                          const startDate = parsePlanDate(plan[phase.startField]);
                          const endDate = parsePlanDate(plan[phase.endField]);
                          const position = getPhasePosition(startDate, endDate);
                          
                          if (position.width === "0%") return null;
                          
                          return (
                            <div
                              key={phase.key}
                              className={`absolute h-6 rounded ${phase.color} ${isActive ? "" : "opacity-60"} shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center`}
                              style={{
                                left: position.left,
                                width: position.width,
                                top: "50%",
                                transform: "translateY(-50%)",
                              }}
                              title={`${phase.label}: ${format(startDate, "MMM dd")} - ${format(endDate, "MMM dd")}`}
                            >
                              <div className="text-xs text-white font-medium px-2 truncate">
                                {phase.label}
                              </div>
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
      
      {/* Legend */}
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

