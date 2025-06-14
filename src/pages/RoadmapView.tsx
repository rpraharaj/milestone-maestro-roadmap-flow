import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, History, Maximize, Minimize, Search } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, differenceInDays, addMonths, subMonths, min as dateMin, max as dateMax } from "date-fns";
import PhaseLegend from "@/components/roadmap/PhaseLegend";
import ColumnVisibilitySettings from "@/components/roadmap/ColumnVisibilitySettings";
import PDFExport from "@/components/roadmap/PDFExport";
import PDFExportView from "@/components/roadmap/PDFExportView";
import { useIsMobile } from "@/hooks/use-mobile";

const TIMELINE_LEFT_WIDTH = 416; // Sum of all column widths
const MONTH_WIDTH = 120;
const ROW_HEIGHT = 48;

// Full view constants - smaller sizes to fit more content
const FULL_VIEW_MONTH_WIDTH = 60;
const FULL_VIEW_ROW_HEIGHT = 32;

// Mobile view constants - even more compact
const MOBILE_MONTH_WIDTH = 40;
const MOBILE_ROW_HEIGHT = 32;
const MOBILE_FULL_VIEW_MONTH_WIDTH = 30;
const MOBILE_FULL_VIEW_ROW_HEIGHT = 24;

export default function RoadmapView() {
  const { data, getActiveRoadmapPlan, getRoadmapHistory } = useData();
  const [showHistory, setShowHistory] = useState<Record<string, boolean>>({});
  const [visibleColumns, setVisibleColumns] = useState({
    rag: true,
    status: true,
    history: true,
    milestone: true,
  });
  const [isFullView, setIsFullView] = useState(false);
  const [capabilityFilter, setCapabilityFilter] = useState<string>("");
  const [selectedCapability, setSelectedCapability] = useState<string>("all");
  const isMobile = useIsMobile();
  const now = new Date();

  const handleColumnToggle = (column: 'rag' | 'status' | 'history' | 'milestone') => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const toggleFullView = () => {
    setIsFullView(prev => !prev);
  };

  // Filter capabilities based on search and selection
  const filteredCapabilities = data.capabilities.filter(capability => {
    const matchesSearch = capability.name.toLowerCase().includes(capabilityFilter.toLowerCase());
    const matchesSelection = selectedCapability === "all" || capability.id === selectedCapability;
    return matchesSearch && matchesSelection;
  });

  // Export to PDF function with improved error handling
  const handleExportPDF = async () => {
    try {
      console.log('Starting PDF export...');
      
      // Try to import the required modules with better error handling
      let jsPDF, html2canvas;
      
      try {
        const modules = await Promise.all([
          import('jspdf'),
          import('html2canvas')
        ]);
        jsPDF = modules[0].default;
        html2canvas = modules[1].default;
        console.log('Modules imported successfully');
      } catch (importError) {
        console.error('Failed to import PDF modules:', importError);
        alert('Failed to load PDF export libraries. Please try again.');
        return;
      }

      // Create a temporary container for the PDF export view
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '0';
      exportContainer.style.zIndex = '-1000';
      document.body.appendChild(exportContainer);

      // Define timeline for PDF export: 24 months from the earliest plan date
      const allPlanDates = getAllPlanDates();
      let pdfTimelineStart: Date;
      if (allPlanDates.length > 0) {
        const earliestPlanDate = dateMin(allPlanDates);
        pdfTimelineStart = startOfMonth(earliestPlanDate);
      } else {
        pdfTimelineStart = startOfMonth(new Date()); // Fallback
      }
      const pdfTimelineEnd = endOfMonth(addMonths(pdfTimelineStart, 23));

      try {
        // Use React 18 createRoot API
        const { createRoot } = await import('react-dom/client');
        const root = createRoot(exportContainer);
        
        console.log('Rendering PDF content...');
        
        // Render the PDF export view
        root.render(
          <PDFExportView
            capabilities={filteredCapabilities}
            getActiveRoadmapPlan={getActiveRoadmapPlan}
            parsePlanDate={parsePlanDate}
            phases={phases}
            timelineStart={pdfTimelineStart}
            timelineEnd={pdfTimelineEnd}
          />
        );
        
        // Wait for render and any potential async operations
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const pdfContent = exportContainer.firstChild as HTMLElement;
        
        if (!pdfContent) {
          throw new Error('Failed to render PDF content');
        }
        
        console.log('Generating canvas from HTML...');
        
        // Generate PDF with improved settings
        const canvas = await html2canvas(pdfContent, {
          scale: 1.5, // Balanced scale for good quality and performance
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: pdfContent.scrollWidth,
          height: pdfContent.scrollHeight,
          logging: false,
        });

        console.log('Creating PDF...');
        
        const imgData = canvas.toDataURL('image/png', 0.95);
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'pt',
          format: 'a3',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 30;

        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const imgRatio = imgWidth / imgHeight;
        
        let finalImgWidth = pdfWidth - margin * 2;
        let finalImgHeight = finalImgWidth / imgRatio;
        
        if (finalImgHeight > pdfHeight - margin * 2) {
          finalImgHeight = pdfHeight - margin * 2;
          finalImgWidth = finalImgHeight * imgRatio;
        }
        
        const imgX = (pdfWidth - finalImgWidth) / 2;
        const imgY = (pdfHeight - finalImgHeight) / 2;

        pdf.addImage(imgData, 'PNG', imgX, imgY, finalImgWidth, finalImgHeight);
        
        console.log('Saving PDF...');
        pdf.save('roadmap-export.pdf');
        
        console.log('PDF export completed successfully');

        // Cleanup
        root.unmount();
      } catch (renderError) {
        console.error('Error during PDF rendering:', renderError);
        alert('Failed to generate PDF. Please try again.');
      } finally {
        // Always cleanup the container
        if (document.body.contains(exportContainer)) {
          document.body.removeChild(exportContainer);
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('An error occurred while generating the PDF. Please check the console for details.');
    }
  };

  // Calculate dynamic column widths based on visibility, view mode, and mobile
  const getColumns = () => {
    let scaleFactor = 1;
    if (isMobile && isFullView) {
      scaleFactor = 0.5; // Extra compact for mobile full view
    } else if (isMobile) {
      scaleFactor = 0.7; // Compact for mobile
    } else if (isFullView) {
      scaleFactor = 0.7; // Compact for desktop full view
    }
    
    const baseColumns = [{ label: 'Capability', width: Math.round(192 * scaleFactor) }];
    const conditionalColumns = [];
    
    if (visibleColumns.rag) {
      conditionalColumns.push({ label: 'RAG', width: Math.round(48 * scaleFactor) });
    }
    if (visibleColumns.status) {
      conditionalColumns.push({ label: 'Status', width: Math.round(112 * scaleFactor) });
    }
    if (visibleColumns.milestone) {
      conditionalColumns.push({ label: 'Milestone', width: Math.round(120 * scaleFactor) });
    }
    if (visibleColumns.history) {
      conditionalColumns.push({ label: 'History', width: Math.round(64 * scaleFactor) });
    }
    
    return [...baseColumns, ...conditionalColumns];
  };

  const columns = getColumns();
  const dynamicLeftWidth = columns.reduce((sum, col) => sum + col.width, 0);

  // Use different dimensions based on view mode and mobile
  const getCurrentDimensions = () => {
    if (isMobile && isFullView) {
      return { monthWidth: MOBILE_FULL_VIEW_MONTH_WIDTH, rowHeight: MOBILE_FULL_VIEW_ROW_HEIGHT };
    } else if (isMobile) {
      return { monthWidth: MOBILE_MONTH_WIDTH, rowHeight: MOBILE_ROW_HEIGHT };
    } else if (isFullView) {
      return { monthWidth: FULL_VIEW_MONTH_WIDTH, rowHeight: FULL_VIEW_ROW_HEIGHT };
    }
    return { monthWidth: MONTH_WIDTH, rowHeight: ROW_HEIGHT };
  };

  const { monthWidth: currentMonthWidth, rowHeight: currentRowHeight } = getCurrentDimensions();

  // Get all plans to determine the full scrollable date range
  const getAllPlanDates = () => {
    const dates: Date[] = [];
    filteredCapabilities.forEach((cap) => {
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
  const timelineContentWidth = headerMonths.length * currentMonthWidth;

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
  filteredCapabilities.forEach((cap) => {
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

  // Get responsive text sizes
  const getTextSizes = () => {
    if (isMobile && isFullView) {
      return {
        title: 'text-sm',
        header: 'text-xs',
        content: 'text-[10px]',
        phase: 'text-[8px]',
        version: 'text-[8px]'
      };
    } else if (isMobile) {
      return {
        title: 'text-base',
        header: 'text-sm',
        content: 'text-xs',
        phase: 'text-[10px]',
        version: 'text-[10px]'
      };
    } else if (isFullView) {
      return {
        title: 'text-base',
        header: 'text-xs',
        content: 'text-xs',
        phase: 'text-[9px]',
        version: 'text-xs'
      };
    }
    return {
      title: 'text-lg',
      header: 'text-sm',
      content: 'text-sm',
      phase: 'text-xs',
      version: 'text-xs'
    };
  };

  const textSizes = getTextSizes();

  return (
    <div className="space-y-6 flex flex-col">
      {/* Filters Section */}
      <Card className="order-0">
        <CardHeader className={isMobile ? 'p-3' : ''}>
          <CardTitle className={textSizes.title}>Filters</CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'p-3' : ''}>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Capability Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search capabilities..."
                  value={capabilityFilter}
                  onChange={(e) => setCapabilityFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Capability Dropdown */}
            <div className="w-full sm:w-48">
              <Select value={selectedCapability} onValueChange={setSelectedCapability}>
                <SelectTrigger>
                  <SelectValue placeholder="Select capability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Capabilities</SelectItem>
                  {data.capabilities.map((capability) => (
                    <SelectItem key={capability.id} value={capability.id}>
                      {capability.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {plansWithCapability.length > 0 ? (
        <Card className={`overflow-hidden order-1 ${isFullView ? 'fixed inset-4 z-50 bg-white' : ''}`}>
          <CardHeader className={isMobile ? 'p-3' : ''}>
            <div className="flex items-center justify-between">
              <CardTitle className={textSizes.title}>Project Timeline</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size={isMobile ? "sm" : "sm"}
                  onClick={toggleFullView}
                  className="flex items-center gap-2"
                >
                  {isFullView ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  {isMobile ? (isFullView ? 'Exit' : 'Full') : (isFullView ? 'Exit Full View' : 'Full View')}
                </Button>
                {!isFullView && <PDFExport onExportPDF={handleExportPDF} />}
                <ColumnVisibilitySettings
                  visibleColumns={visibleColumns}
                  onColumnToggle={handleColumnToggle}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex">
              {/* Fixed Columns */}
              <div 
                className="flex-shrink-0 bg-white border-r border-gray-200"
                style={{ width: dynamicLeftWidth }}
              >
                {/* Header Row */}
                <div className="flex border-b border-gray-200 bg-gray-50" style={{ height: currentRowHeight }}>
                  {columns.map((col) => (
                    <div
                      key={col.label}
                      className={`flex items-center justify-center ${textSizes.header} font-medium text-gray-600 border-r border-gray-200 last:border-r-0`}
                      style={{ width: col.width, height: currentRowHeight }}
                    >
                      {col.label}
                    </div>
                  ))}
                </div>
                
                {/* Data Rows */}
                {filteredCapabilities.map((capability) => {
                  const activePlan = getActiveRoadmapPlan(capability.id);
                  const history = getRoadmapHistory(capability.id);
                  const hasHistory = history.length > 1;
                  const plansToShow = showHistory[capability.id] 
                    ? [activePlan, ...history.slice(1)].filter(Boolean)
                    : activePlan ? [activePlan] : [];
                  
                  return plansToShow.map((plan, planIndex) => {
                    const isActive = planIndex === 0;
                    // Find milestone for this capability
                    const milestone = data.milestones.find(m => 
                      m.capabilityIds.includes(capability.id)
                    );
                    
                    return (
                      <div key={`${capability.id}-${plan.id}`} className="flex border-b border-gray-100" style={{ height: currentRowHeight }}>
                        {/* Capability Name with Version */}
                        <div className={`flex items-center ${isMobile ? 'px-1' : 'px-2'} border-r border-gray-200`} style={{ width: columns.find(c => c.label === 'Capability')?.width || 192 }}>
                          <span className={`font-medium truncate ${textSizes.content}`} title={capability.name}>
                            {capability.name}
                          </span>
                          {plan && (
                            <span className={`ml-1 ${textSizes.version} text-gray-500 font-normal`}>
                              v{plan.version}
                            </span>
                          )}
                        </div>
                        
                        {/* RAG Status */}
                        {visibleColumns.rag && (
                          <div className="flex items-center justify-center border-r border-gray-200" style={{ width: columns.find(c => c.label === 'RAG')?.width || 48 }}>
                            <span
                              className={`inline-block ${isMobile && isFullView ? 'h-1.5 w-1.5' : isMobile ? 'h-2 w-2' : isFullView ? 'h-2 w-2' : 'h-3 w-3'} rounded-full ${
                                capability.ragStatus === "Red"
                                  ? "bg-red-500"
                                  : capability.ragStatus === "Amber"
                                  ? "bg-amber-400"
                                  : "bg-green-500"
                              }`}
                              title={capability.ragStatus}
                            />
                          </div>
                        )}
                        
                        {/* Status */}
                        {visibleColumns.status && (
                          <div className={`flex items-center ${isMobile ? 'px-1' : 'px-2'} ${textSizes.content} text-gray-600 border-r border-gray-200`} style={{ width: columns.find(c => c.label === 'Status')?.width || 112 }}>
                            {capability.status}
                          </div>
                        )}
                        
                        {/* Technical Milestone */}
                        {visibleColumns.milestone && (
                          <div className={`flex items-center ${isMobile ? 'px-1' : 'px-2'} ${textSizes.content} text-gray-600 border-r border-gray-200`} style={{ width: columns.find(c => c.label === 'Milestone')?.width || 120 }}>
                            <span className="truncate" title={milestone?.name || 'No milestone'}>
                              {milestone?.name || '-'}
                            </span>
                          </div>
                        )}
                        
                        {/* History Toggle */}
                        {visibleColumns.history && (
                          <div className="flex items-center justify-center" style={{ width: columns.find(c => c.label === 'History')?.width || 64 }}>
                            {isActive && hasHistory && !isFullView && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleHistory(capability.id)}
                                className={`${isMobile ? 'h-4 w-4 p-0' : 'h-6 w-6 p-0'}`}
                                title={showHistory[capability.id] ? "Hide History" : "Show History"}
                              >
                                <History className={`${isMobile ? 'h-2 w-2' : 'h-3 w-3'}`} />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  });
                })}
              </div>

              {/* Visual Timeline */}
              <div 
                className={`flex-1 ${isFullView ? 'overflow-hidden' : 'overflow-x-auto'}`}
                style={{ 
                  scrollBehavior: 'smooth',
                }}
                ref={(ref) => {
                  if (ref && !isFullView && initialScrollLeft > 0) {
                    // Set initial scroll position to show default view
                    setTimeout(() => {
                      ref.scrollLeft = initialScrollLeft;
                    }, 100);
                  }
                }}
              >
                <div style={{ minWidth: isFullView ? '100%' : timelineContentWidth, width: isFullView ? '100%' : timelineContentWidth }}>
                  {/* Timeline Header */}
                  <div className="flex border-b border-gray-200 bg-gray-50" style={{ height: currentRowHeight }}>
                    {headerMonths.map((month) => (
                      <div
                        key={month.toISOString()}
                        className={`flex items-center justify-center ${textSizes.header} font-medium text-gray-600 border-l border-gray-200 first:border-l-0`}
                        style={{ 
                          width: isFullView ? `${100 / headerMonths.length}%` : currentMonthWidth, 
                          height: currentRowHeight,
                          minWidth: isFullView ? 'auto' : currentMonthWidth
                        }}
                      >
                        {format(month, isMobile && isFullView ? "MMM" : isMobile ? "MMM yy" : isFullView ? "MMM yy" : "MMM yyyy")}
                      </div>
                    ))}
                  </div>
                  
                  {/* Timeline Rows */}
                  {plansWithCapability.map(({ capability, plan, isActive }) => (
                    <div
                      key={`${capability.id}-${plan.id}`}
                      className="relative border-b border-gray-100"
                      style={{ height: currentRowHeight, minWidth: isFullView ? '100%' : timelineContentWidth }}
                    >
                      <div className="relative w-full h-full flex items-center px-1">
                        {phases.map((phase) => {
                          const startDate = parsePlanDate(plan[phase.startField]);
                          const endDate = parsePlanDate(plan[phase.endField]);
                          const position = getPhasePosition(startDate, endDate);
                          
                          if (position.width === "0%") return null;
                          
                          const phaseHeight = isMobile && isFullView ? 'h-3' : isMobile ? 'h-4' : isFullView ? 'h-4' : 'h-6';
                          
                          return (
                            <div
                              key={phase.key}
                              className={`absolute ${phaseHeight} rounded ${phase.color} ${isActive ? "" : "opacity-60"} shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center`}
                              style={{
                                left: position.left,
                                width: position.width,
                                top: "50%",
                                transform: "translateY(-50%)",
                              }}
                              title={`${phase.label}: ${format(startDate, "MMM dd")} - ${format(endDate, "MMM dd")}`}
                            >
                              <div className={`${textSizes.phase} text-white font-medium px-1 truncate`}>
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
                {capabilityFilter || selectedCapability !== "all" 
                  ? "No capabilities match the current filters"
                  : "Create capabilities and their roadmap plans to see the visual timeline"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Legend - hidden in full view */}
      {!isFullView && (
        <Card className="order-2">
          <CardHeader className={isMobile ? 'p-3' : ''}>
            <CardTitle className={textSizes.title}>Phase Legend</CardTitle>
          </CardHeader>
          <CardContent className={isMobile ? 'p-3' : ''}>
            <PhaseLegend phases={phases} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
