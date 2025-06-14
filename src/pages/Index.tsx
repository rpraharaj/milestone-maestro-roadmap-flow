
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Calendar, Map, BarChart3 } from "lucide-react";
import { format, eachMonthOfInterval, differenceInDays, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const { data, getActiveRoadmapPlan } = useData();
  const isMobile = useIsMobile();

  const stats = [
    {
      title: "Total Capabilities",
      value: data.capabilities.length,
      icon: Target,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
    {
      title: "Active Milestones",
      value: data.milestones.length,
      icon: Calendar,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
    {
      title: "Roadmap Plans",
      value: data.roadmapPlans.filter(plan => plan.isActive).length,
      icon: Map,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
    {
      title: "Completed Capabilities",
      value: data.capabilities.filter(cap => cap.status === 'Completed').length,
      icon: BarChart3,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
  ];

  const getRAGStatusColor = (ragStatus: string) => {
    switch (ragStatus) {
      case 'Red':
        return 'bg-red-500 text-white';
      case 'Amber':
        return 'bg-amber-500 text-white';
      case 'Green':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Not Started':
        return 'bg-gray-100 text-gray-800';
      case 'On Hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Timeline phases configuration - updated to match roadmap view colors
  const phases = [
    {
      key: 'requirement',
      label: 'Req',
      color: 'bg-blue-500',
      startField: 'requirementStartDate',
      endField: 'requirementEndDate',
    },
    {
      key: 'design',
      label: 'Design',
      color: 'bg-purple-500',
      startField: 'designStartDate',
      endField: 'designEndDate',
    },
    {
      key: 'dev',
      label: 'Dev',
      color: 'bg-green-500',
      startField: 'devStartDate',
      endField: 'devEndDate',
    },
    {
      key: 'cst',
      label: 'CST',
      color: 'bg-orange-500',
      startField: 'cstStartDate',
      endField: 'cstEndDate',
    },
    {
      key: 'uat',
      label: 'UAT',
      color: 'bg-red-500',
      startField: 'uatStartDate',
      endField: 'uatEndDate',
    },
  ];

  // Timeline constants - updated to match roadmap view
  const MONTH_WIDTH = isMobile ? 80 : 120; // Match roadmap view
  const ROW_HEIGHT = 48; // Match roadmap view (h-12)

  // Get capabilities with active plans
  const capabilitiesWithPlans = data.capabilities.map(capability => {
    const activePlan = getActiveRoadmapPlan(capability.id);
    return { capability, plan: activePlan };
  }).filter(item => item.plan);

  // Calculate timeline bounds
  const getTimelineBounds = () => {
    if (capabilitiesWithPlans.length === 0) return null;
    
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    capabilitiesWithPlans.forEach(({ plan }) => {
      if (!plan) return;
      
      phases.forEach(phase => {
        const startDate = plan[phase.startField] as Date;
        const endDate = plan[phase.endField] as Date;
        
        if (!minDate || startDate < minDate) minDate = startDate;
        if (!maxDate || endDate > maxDate) maxDate = endDate;
      });
    });

    return minDate && maxDate ? { minDate, maxDate } : null;
  };

  const timelineBounds = getTimelineBounds();
  
  // Calculate default visible timeline (1 month before current + current + 11 months after = 13 months total)
  const now = new Date();
  const defaultVisibleStart = startOfMonth(subMonths(now, 1));
  const defaultVisibleEnd = endOfMonth(addMonths(now, 11));
  
  // Calculate full scrollable timeline (extend if plans exist outside default range)
  let fullTimelineStart = defaultVisibleStart;
  let fullTimelineEnd = defaultVisibleEnd;
  
  if (timelineBounds) {
    if (timelineBounds.minDate < defaultVisibleStart) {
      fullTimelineStart = startOfMonth(subMonths(timelineBounds.minDate, 1));
    }
    if (timelineBounds.maxDate > defaultVisibleEnd) {
      fullTimelineEnd = endOfMonth(addMonths(timelineBounds.maxDate, 1));
    }
  }
  
  const getPhasePosition = (startDate: Date, endDate: Date) => {
    if (!timelineBounds) return { left: '0%', width: '0%' };
    
    const totalDays = differenceInDays(fullTimelineEnd, fullTimelineStart);
    const startOffset = differenceInDays(startDate, fullTimelineStart);
    const duration = differenceInDays(endDate, startDate) + 1;
    
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    
    return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.max(1, width)}%`,
    };
  };

  // Generate all months for the scrollable timeline
  const allMonths = eachMonthOfInterval({
    start: fullTimelineStart,
    end: fullTimelineEnd
  });

  // Generate default view months for calculating scroll position
  const defaultViewMonths = eachMonthOfInterval({
    start: defaultVisibleStart,
    end: defaultVisibleEnd
  });

  const timelineContentWidth = allMonths.length * MONTH_WIDTH;

  // Calculate initial scroll position to show default view (1 month before current + 11 after)
  const monthsBeforeDefault = eachMonthOfInterval({ 
    start: fullTimelineStart, 
    end: subMonths(defaultVisibleStart, 1) 
  });
  const initialScrollLeft = monthsBeforeDefault.length * MONTH_WIDTH;

  console.log('Dashboard Timeline Debug:', {
    now: format(now, 'MMM yyyy'),
    defaultVisibleStart: format(defaultVisibleStart, 'MMM yyyy'),
    defaultVisibleEnd: format(defaultVisibleEnd, 'MMM yyyy'),
    fullTimelineStart: format(fullTimelineStart, 'MMM yyyy'),
    fullTimelineEnd: format(fullTimelineEnd, 'MMM yyyy'),
    monthsBeforeDefault: monthsBeforeDefault.length,
    initialScrollLeft,
    MONTH_WIDTH,
    totalMonths: allMonths.length
  });

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                      {stat.title}
                    </p>
                    <p className="text-lg sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-2 sm:p-3 rounded-full ${stat.bgColor} flex-shrink-0 ml-2`}>
                    <Icon className={`h-4 w-4 sm:h-6 sm:w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Project Timeline */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5" />
            Project Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {capabilitiesWithPlans.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No capabilities with roadmap plans found</p>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex">
                {/* Fixed capability info column */}
                <div className="w-56 flex-shrink-0 bg-gray-50 border-r border-gray-200">
                  <div 
                    className="flex items-center px-4 border-b border-gray-200 bg-gray-100"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Capability
                    </span>
                  </div>
                  {capabilitiesWithPlans.map(({ capability }) => (
                    <div 
                      key={capability.id} 
                      className="flex items-center px-4 border-b border-gray-100 last:border-b-0"
                      style={{ height: ROW_HEIGHT }}
                    >
                      <span className="font-medium text-gray-900 truncate text-sm" title={capability.name}>
                        {capability.name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Scrollable timeline area */}
                <div className="flex-1 min-w-0 bg-white">
                  <div 
                    className="overflow-x-auto"
                    style={{ 
                      scrollBehavior: 'smooth',
                    }}
                    ref={(ref) => {
                      if (ref && initialScrollLeft > 0) {
                        // Set initial scroll position to show default view
                        setTimeout(() => {
                          ref.scrollLeft = initialScrollLeft;
                          console.log('Dashboard scroll positioned to:', initialScrollLeft);
                        }, 100);
                      }
                    }}
                  >
                    <div style={{ width: `${timelineContentWidth}px` }}>
                      {/* Timeline header with months */}
                      <div 
                        className="flex border-b border-gray-200 bg-gray-50"
                        style={{ height: ROW_HEIGHT }}
                      >
                        {allMonths.map((month) => (
                          <div
                            key={month.toISOString()}
                            className="text-center text-xs font-medium text-gray-600 border-l border-gray-200 first:border-l-0 flex items-center justify-center"
                            style={{ minWidth: `${MONTH_WIDTH}px`, width: `${MONTH_WIDTH}px` }}
                          >
                            {format(month, isMobile ? "MMM yy" : "MMM yyyy")}
                          </div>
                        ))}
                      </div>

                      {/* Timeline bars for each capability */}
                      {capabilitiesWithPlans.map(({ capability, plan }) => (
                        <div 
                          key={capability.id} 
                          className="border-b border-gray-100 last:border-b-0 flex items-center px-2"
                          style={{ height: ROW_HEIGHT }}
                        >
                          <div className="relative w-full h-6">
                            {phases.map((phase) => {
                              const startDate = plan![phase.startField] as Date;
                              const endDate = plan![phase.endField] as Date;
                              const position = getPhasePosition(startDate, endDate);
                              
                              return (
                                <div
                                  key={phase.key}
                                  className={`absolute h-5 rounded-sm ${phase.color} shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center justify-center`}
                                  style={{
                                    left: position.left,
                                    width: position.width,
                                    top: '2px',
                                  }}
                                  title={`${phase.label}: ${format(startDate, "MMM dd")} - ${format(endDate, "MMM dd")}`}
                                >
                                  <div className="text-xs text-white font-medium px-1 truncate leading-5 opacity-90 group-hover:opacity-100 text-center">
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
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
