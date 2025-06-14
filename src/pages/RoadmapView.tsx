import { useState, useMemo, useRef, useEffect } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, MapPin } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, differenceInDays, addMonths, subMonths, min as dateMin, max as dateMax } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function RoadmapView() {
  const { data, getActiveRoadmapPlan, getRoadmapHistory } = useData();
  const [showHistory, setShowHistory] = useState<Record<string, boolean>>({});
  // --- 1. Compute default timeline window (3 months before, 9 months after now) ---
  const now = new Date();
  const timelineDefaultStart = startOfMonth(subMonths(now, 3));
  const timelineDefaultEnd = endOfMonth(addMonths(now, 9));

  // Get all roadmap plans (active and historical)
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

  // --- 2. Compute *true* bounds with all plans' dates ---
  const planDateExtremes = useMemo(() => {
    if (allPlans.length === 0) return { minDate: timelineDefaultStart, maxDate: timelineDefaultEnd };
    let minDate = timelineDefaultStart;
    let maxDate = timelineDefaultEnd;
    allPlans.forEach(({ plan }) => {
      const dates = [
        plan.requirementStartDate,
        plan.requirementEndDate,
        plan.designStartDate,
        plan.designEndDate,
        plan.devStartDate,
        plan.devEndDate,
        plan.cstStartDate,
        plan.cstEndDate,
        plan.uatStartDate,
        plan.uatEndDate,
      ].map(d => new Date(d));
      minDate = dateMin([minDate, ...dates]);
      maxDate = dateMax([maxDate, ...dates]);
    });
    return { minDate: startOfMonth(minDate), maxDate: endOfMonth(maxDate) };
  }, [allPlans, timelineDefaultStart, timelineDefaultEnd]);

  // --- 3. Use default visible window for viewport, but allow content width to spread over actual plan range ---
  const visibleTimelineStart = timelineDefaultStart;
  const visibleTimelineEnd = timelineDefaultEnd;
  const actualContentStart = planDateExtremes.minDate;
  const actualContentEnd = planDateExtremes.maxDate;

  // Months for header (for visible window)
  const headerMonths = eachMonthOfInterval({ start: visibleTimelineStart, end: visibleTimelineEnd });
  // Months for content (could be larger than header)
  const contentMonths = eachMonthOfInterval({ start: actualContentStart, end: actualContentEnd });

  // We calculate width: each month will be fixed px (e.g. 120px), so content W = Nmonths * px/unit
  const MONTH_WIDTH = 120;
  const TIMELINE_MIN_HEIGHT = 140;
  const timelineContentWidth = contentMonths.length * MONTH_WIDTH;
  const timelineViewportWidth = headerMonths.length * MONTH_WIDTH;

  // For aligning bars: offset every plan/phase bars based on their date relative to actualContentStart
  const getPhasePosition = (startDate: Date, endDate: Date) => {
    // clamp values within min/max
    const startOffset = differenceInDays(startDate, actualContentStart);
    const duration = differenceInDays(endDate, startDate);
    const totalDays = differenceInDays(actualContentEnd, actualContentStart);
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    return {
      left: `calc(${left}% )`,
      width: `calc(${width}% )`
    };
  };

  // --- 4. Use ref+effect: scroll to today in view on mount/first render (so default is today centered/at start) ---
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Scroll so "today" (or the month containing today) is visible at left after mount.
    if (!scrollAreaRef.current) return;
    // where to scroll left? (find the pixel offset of current month in content, subtract month width * 3 for 3 months before)
    const currentMonthIndex = contentMonths.findIndex(m => 
      m.getFullYear() === now.getFullYear() && m.getMonth() === now.getMonth()
    );
    const scrollToPx = Math.max(0, (currentMonthIndex - 3) * MONTH_WIDTH);
    scrollAreaRef.current.scrollLeft = scrollToPx;
  }, [now, contentMonths.length]);

  // Renamed phases as per your requirement
  const phases = [
    { key: 'requirement', label: 'REQ', color: 'bg-blue-500', startField: 'requirementStartDate', endField: 'requirementEndDate' },
    { key: 'design', label: 'DES', color: 'bg-purple-500', startField: 'designStartDate', endField: 'designEndDate' },
    { key: 'dev', label: 'DEV', color: 'bg-green-500', startField: 'devStartDate', endField: 'devEndDate' },
    { key: 'cst', label: 'CST', color: 'bg-orange-500', startField: 'cstStartDate', endField: 'cstEndDate' },
    { key: 'uat', label: 'UAT', color: 'bg-red-500', startField: 'uatStartDate', endField: 'uatEndDate' },
  ];

  return (
    <div className="space-y-6 flex flex-col">
      {/* Timeline FIRST, legend later */}
      {allPlans.length > 0 ? (
        <Card className="overflow-hidden order-1">
          <CardHeader>
            <CardTitle className="text-lg">Project Timeline</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Horizontal scroll area for timeline */}
            <div
              className="w-full"
              style={{
                // fixed width for viewport, this ensures we always see only 12 months (3 prior, 9 future)
                overflowX: "auto",
                minHeight: TIMELINE_MIN_HEIGHT,
              }}
              ref={scrollAreaRef}
            >
              {/* This container grows if there are extra months (plans outside of window) */}
              <div
                className="relative"
                style={{
                  minWidth: `${timelineViewportWidth}px`,
                  width: `${timelineContentWidth}px`,
                  maxWidth: "none",
                }}
              >
                {/* Timeline Header (relative to the plan date range, contentMonths) */}
                <div className="border-b bg-gray-50 p-4 sticky top-0 z-10">
                  <div className="flex">
                    {/* Capability column offset */}
                    <div className="w-56 flex-shrink-0" />
                    <div className="flex-1 relative">
                      <div className="flex" style={{ minWidth: `${timelineContentWidth}px` }}>
                        {contentMonths.map((month) => (
                          <div
                            key={month.toISOString()}
                            className="text-center text-sm font-medium text-gray-600 border-l border-gray-200 flex items-center justify-center"
                            style={{
                              minWidth: `${MONTH_WIDTH}px`,
                              width: `${MONTH_WIDTH}px`,
                            }}
                          >
                            {format(month, "MMM yyyy")}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Timeline Content */}
                <div className="divide-y divide-gray-200">
                  {data.capabilities.map(capability => {
                    const activePlan = getActiveRoadmapPlan(capability.id);
                    const history = getRoadmapHistory(capability.id);
                    const hasHistory = history.length > 1;
                    const plansToShow = [
                      ...(activePlan ? [{ plan: activePlan, isActive: true }] : []),
                      ...(showHistory[capability.id] ? history.slice(1).map(plan => ({ plan, isActive: false })) : [])
                    ];
                    if (plansToShow.length === 0) return null;
                    return (
                      <div key={capability.id} className="bg-white">
                        {plansToShow.map(({ plan, isActive }, planIndex) => (
                          <div key={plan.id} className="flex items-stretch py-4 hover:bg-gray-50">
                            {/* Capability Column: reduced width */}
                            <div className="w-56 flex-shrink-0 px-4 flex flex-col justify-center">
                              <div>
                                {/* Capability name and badges */}
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
                                {/* Show/Hide History button on a separate row below metadata */}
                                {planIndex === 0 && hasHistory && (
                                  <div className="mt-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setShowHistory(prev => ({
                                        ...prev,
                                        [capability.id]: !prev[capability.id]
                                      }))}
                                      className="text-xs w-full flex justify-start"
                                    >
                                      <History className="h-3 w-3 mr-1" />
                                      {showHistory[capability.id] ? 'Hide' : 'Show'} History
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Timeline Column: increased width by flex-grow */}
                            <div className="flex-1 relative h-8 px-4 min-w-0">
                              <div className="relative h-full w-full">
                                {phases.map(phase => {
                                  const startDate = new Date(plan[phase.startField as keyof typeof plan]);
                                  const endDate = new Date(plan[phase.endField as keyof typeof plan]);
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

      {/* Legend moved to BOTTOM, order-2 */}
      <Card className="order-2">
        <CardHeader>
          <CardTitle className="text-lg">Phase Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {phases.map(phase => (
              <div key={phase.key} className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded ${phase.color}`}></div>
                <span className="text-sm font-medium">{phase.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Reminder: This file is growing large (>270 lines)! Please consider refactoring it into smaller components for maintainability.
