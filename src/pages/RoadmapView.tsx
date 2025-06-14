
import { useState, useMemo, useRef, useEffect } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, MapPin } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, differenceInDays, addMonths, subMonths, min as dateMin, max as dateMax } from "date-fns";
import TimelineHeader from "@/components/roadmap/TimelineHeader";
import TimelineRow from "@/components/roadmap/TimelineRow";
import PhaseLegend from "@/components/roadmap/PhaseLegend";

export default function RoadmapView() {
  const { data, getActiveRoadmapPlan, getRoadmapHistory } = useData();
  const [showHistory, setShowHistory] = useState<Record<string, boolean>>({});
  // --- 1. Compute default timeline window (3 months before, 9 months after now) ---
  const now = new Date();
  const timelineDefaultStart = startOfMonth(subMonths(now, 3));
  const timelineDefaultEnd = endOfMonth(addMonths(now, 9));

  // Helper to safely parse dates from plan fields
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
      // Only include values which are strings, numbers, or Date (skip boolean, undefined, etc)
      function isValidDateInput(d: unknown): d is string | number | Date {
        return (
          (typeof d === "string" || typeof d === "number" || d instanceof Date)
          && typeof d !== "boolean"
        );
      }
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
      ]
        .filter(isValidDateInput)
        .map(d => new Date(d));
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
    if (!scrollAreaRef.current) return;
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
                {/* Timeline Header */}
                <TimelineHeader
                  months={contentMonths}
                  monthWidth={MONTH_WIDTH}
                  contentWidth={timelineContentWidth}
                />
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
                      <TimelineRow
                        key={capability.id}
                        capability={capability}
                        plansToShow={plansToShow}
                        showHistory={!!showHistory[capability.id]}
                        hasHistory={hasHistory}
                        onToggleHistory={() =>
                          setShowHistory(prev => ({
                            ...prev,
                            [capability.id]: !prev[capability.id]
                          }))
                        }
                        getPhasePosition={getPhasePosition}
                        parsePlanDate={parsePlanDate}
                        phases={phases}
                      />
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
          <PhaseLegend phases={phases} />
        </CardContent>
      </Card>
    </div>
  );
}
