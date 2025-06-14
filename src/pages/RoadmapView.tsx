
import { useState, useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, History, MapPin } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, differenceInDays } from "date-fns";

const RoadmapView = () => {
  const { data, getActiveRoadmapPlan, getRoadmapHistory } = useData();
  const [showHistory, setShowHistory] = useState<Record<string, boolean>>({});
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null);

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

  // Calculate timeline bounds
  const timelineBounds = useMemo(() => {
    if (allPlans.length === 0) {
      const now = new Date();
      return {
        start: startOfMonth(now),
        end: endOfMonth(new Date(now.getFullYear(), now.getMonth() + 12))
      };
    }
    let minDate = new Date();
    let maxDate = new Date();
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
      ];
      dates.forEach(date => {
        if (date < minDate) minDate = date;
        if (date > maxDate) maxDate = date;
      });
    });
    return {
      start: startOfMonth(minDate),
      end: endOfMonth(maxDate)
    };
  }, [allPlans]);

  const months = eachMonthOfInterval(timelineBounds);
  const totalDays = differenceInDays(timelineBounds.end, timelineBounds.start);

  const toggleHistory = (capabilityId: string) => {
    setShowHistory(prev => ({
      ...prev,
      [capabilityId]: !prev[capabilityId]
    }));
  };

  // Instead of stacking (offsetting) by phase, show all bars in a single horizontal line
  const getPhasePosition = (startDate: Date, endDate: Date) => {
    const startOffset = differenceInDays(startDate, timelineBounds.start);
    const duration = differenceInDays(endDate, startDate);
    const leftPercent = (startOffset / totalDays) * 100;
    const widthPercent = (duration / totalDays) * 100;
    return {
      left: `${Math.max(0, leftPercent)}%`,
      width: `${Math.max(1, widthPercent)}%`
    };
  };

  const phases = [
    { key: 'requirement', label: 'Req', color: 'bg-blue-500', startField: 'requirementStartDate', endField: 'requirementEndDate' },
    { key: 'design', label: 'Design', color: 'bg-purple-500', startField: 'designStartDate', endField: 'designEndDate' },
    { key: 'dev', label: 'Dev', color: 'bg-green-500', startField: 'devStartDate', endField: 'devEndDate' },
    { key: 'cst', label: 'CST', color: 'bg-orange-500', startField: 'cstStartDate', endField: 'cstEndDate' },
    { key: 'uat', label: 'UAT', color: 'bg-red-500', startField: 'uatStartDate', endField: 'uatEndDate' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roadmap View</h1>
          <p className="text-gray-600 mt-2">Visual timeline of capability roadmaps</p>
        </div>
      </div>

      {/* Legend */}
      <Card>
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

      {/* Timeline */}
      {allPlans.length > 0 ? (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Project Timeline</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Timeline Header */}
            <div className="border-b bg-gray-50 p-4">
              <div className="flex">
                <div className="w-80 flex-shrink-0"></div>
                <div className="flex-1 relative">
                  <div className="flex">
                    {months.map((month, index) => (
                      <div
                        key={month.toISOString()}
                        className="flex-1 text-center text-sm font-medium text-gray-600 border-l border-gray-200 px-2"
                        style={{ minWidth: '60px' }}
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
                      <div key={plan.id} className="flex items-center py-4 hover:bg-gray-50">
                        <div className="w-80 flex-shrink-0 px-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900">
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
                            </div>
                            {planIndex === 0 && hasHistory && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleHistory(capability.id)}
                                className="text-xs"
                              >
                                <History className="h-3 w-3 mr-1" />
                                {showHistory[capability.id] ? 'Hide' : 'Show'} History
                              </Button>
                            )}
                          </div>
                        </div>
                        {/* PHASES: All phases in a single row */}
                        <div className="flex-1 relative h-8 px-4">
                          <div className="relative h-full w-full">
                            {phases.map(phase => {
                              const startDate = plan[phase.startField as keyof typeof plan] as Date;
                              const endDate = plan[phase.endField as keyof typeof plan] as Date;
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
          </CardContent>
        </Card>
      ) : (
        <Card>
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
    </div>
  );
};

export default RoadmapView;

