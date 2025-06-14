
import React from "react";
import { format, eachMonthOfInterval, differenceInDays, min as dateMin, max as dateMax } from "date-fns";

interface Capability {
  id: string;
  name: string;
  ragStatus: string;
}

interface Plan {
  id: string;
  version: number;
  [key: string]: any;
}

interface Phase {
  key: string;
  label: string;
  color: string;
  startField: string;
  endField: string;
}

interface PDFExportViewProps {
  capabilities: Capability[];
  getActiveRoadmapPlan: (id: string) => Plan | undefined;
  parsePlanDate: (val: unknown, fallback?: Date) => Date;
  phases: Phase[];
  timelineStart: Date;
  timelineEnd: Date;
}

const MONTH_WIDTH = 80;
const ROW_HEIGHT = 40;

export default function PDFExportView({
  capabilities,
  getActiveRoadmapPlan,
  parsePlanDate,
  phases,
  timelineStart,
  timelineEnd,
}: PDFExportViewProps) {
  const headerMonths = eachMonthOfInterval({ start: timelineStart, end: timelineEnd });
  const timelineContentWidth = headerMonths.length * MONTH_WIDTH;

  const getPhasePosition = (startDate: Date, endDate: Date) => {
    const clampedStart = dateMax([startDate, timelineStart]);
    const clampedEnd = dateMin([endDate, timelineEnd]);
    if (clampedEnd < clampedStart) {
      return { left: "0%", width: "0%" };
    }
    const startOffset = differenceInDays(clampedStart, timelineStart);
    const duration = differenceInDays(clampedEnd, clampedStart);
    const totalDays = differenceInDays(timelineEnd, timelineStart);
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    return {
      left: `${left}%`,
      width: `${width}%`,
    };
  };

  return (
    <div className="bg-white p-4" style={{ minWidth: '1600px', fontSize: '12px', lineHeight: '1.2' }}>
      {/* Header - Minimal spacing */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Project Roadmap</h1>
        <p className="text-xs text-gray-600">Generated on {format(new Date(), "MMMM dd, yyyy")}</p>
      </div>
      
      <div className="border border-gray-300 rounded overflow-hidden shadow-sm">
        {/* Header Row */}
        <div className="flex bg-gray-100 border-b border-gray-300" style={{ height: ROW_HEIGHT }}>
          <div className="w-64 px-3 py-2 font-semibold text-gray-800 border-r border-gray-300 text-xs flex items-center justify-center">
            Capability
          </div>
          <div className="w-12 px-1 py-2 font-semibold text-gray-800 text-center border-r border-gray-300 text-xs flex items-center justify-center">
            RAG
          </div>
          <div className="flex-1 px-2 py-2 font-semibold text-gray-800 border-r border-gray-300">
            <div className="flex items-center justify-center" style={{ minWidth: timelineContentWidth }}>
              {headerMonths.map((month) => (
                <div
                  key={month.toISOString()}
                  className="text-center font-semibold text-gray-700 border-l border-gray-200 first:border-l-0 flex items-center justify-center"
                  style={{ width: MONTH_WIDTH, fontSize: '10px', height: '100%' }}
                >
                  {format(month, "MMM yy")}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Rows */}
        {capabilities.map((capability, index) => {
          const activePlan = getActiveRoadmapPlan(capability.id);
          if (!activePlan) return null;

          return (
            <div 
              key={capability.id} 
              className={`flex border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`} 
              style={{ height: ROW_HEIGHT }}
            >
              {/* Capability Name */}
              <div className="w-64 px-3 py-2 border-r border-gray-300 flex items-center">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-xs leading-tight truncate">
                    {capability.name}
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5">
                    V{activePlan.version}
                  </div>
                </div>
              </div>
              
              {/* RAG Status */}
              <div className="w-12 px-1 py-2 border-r border-gray-300 flex items-center justify-center">
                <div
                  className={`w-3 h-3 rounded-full ${
                    capability.ragStatus === "Red"
                      ? "bg-red-500"
                      : capability.ragStatus === "Amber"
                      ? "bg-amber-400"
                      : "bg-green-500"
                  }`}
                  title={capability.ragStatus}
                />
              </div>
              
              {/* Timeline */}
              <div className="flex-1 px-2 py-2 border-r border-gray-300">
                <div className="relative flex items-center" style={{ minWidth: timelineContentWidth, height: '24px' }}>
                  {phases.map((phase) => {
                    const startDate = parsePlanDate(activePlan[phase.startField]);
                    const endDate = parsePlanDate(activePlan[phase.endField]);
                    const position = getPhasePosition(startDate, endDate);
                    
                    if (position.width === "0%") return null;
                    
                    return (
                      <div
                        key={phase.key}
                        className={`absolute h-5 rounded ${phase.color} shadow-sm flex items-center justify-center`}
                        style={{
                          left: position.left,
                          width: position.width,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          minWidth: '40px',
                        }}
                      >
                        <div className="text-white font-medium px-1 truncate text-xs">
                          {phase.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Phase Legend</h3>
        <div className="flex flex-wrap gap-3">
          {phases.map((phase) => (
            <div key={phase.key} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded ${phase.color}`} />
              <span className="text-xs font-medium text-gray-700">{phase.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
