
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

const MONTH_WIDTH = 100;
const ROW_HEIGHT = 48;
const LEFT_PANEL_WIDTH = 250;
const RAG_COL_WIDTH = 50;

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
  const totalWidth = LEFT_PANEL_WIDTH + RAG_COL_WIDTH + timelineContentWidth;

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
    <div className="bg-white p-6 font-sans" style={{ width: totalWidth, fontSize: '12px' }}>
      <div className="border border-gray-200 shadow-sm">
        {/* Header Row */}
        <div className="flex bg-gray-50" style={{ height: ROW_HEIGHT }}>
          <div className="px-4 py-2 font-semibold text-gray-800 border-r border-gray-200 flex items-center" style={{ width: LEFT_PANEL_WIDTH }}>
            Capability
          </div>
          <div className="px-2 py-2 font-semibold text-gray-800 text-center border-r border-gray-200 flex items-center justify-center" style={{ width: RAG_COL_WIDTH }}>
            RAG
          </div>
          <div className="flex-1 flex">
            {headerMonths.map((month) => (
              <div
                key={month.toISOString()}
                className="text-center font-semibold text-gray-600 border-l border-gray-200 flex items-center justify-center text-sm"
                style={{ width: MONTH_WIDTH }}
              >
                {format(month, "MMM yyyy")}
              </div>
            ))}
          </div>
        </div>

        {/* Data Rows */}
        {capabilities.map((capability, index) => {
          const activePlan = getActiveRoadmapPlan(capability.id);
          if (!activePlan) return null;

          return (
            <div 
              key={capability.id} 
              className={`flex border-t border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`} 
              style={{ minHeight: ROW_HEIGHT }}
            >
              {/* Capability Name */}
              <div className="px-4 py-2 border-r border-gray-200 flex items-center" style={{ width: LEFT_PANEL_WIDTH }}>
                <span className="font-medium text-gray-900 text-sm truncate" title={capability.name}>
                  {capability.name}
                </span>
                <span className="ml-2 text-sm text-gray-500 font-normal">
                  v{activePlan.version}
                </span>
              </div>
              
              {/* RAG Status */}
              <div className="px-2 py-2 border-r border-gray-200 flex items-center justify-center" style={{ width: RAG_COL_WIDTH }}>
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
              <div className="flex-1 relative">
                <div className="relative w-full h-full flex items-center px-1" style={{ height: ROW_HEIGHT }}>
                  {phases.map((phase) => {
                    const startDate = parsePlanDate(activePlan[phase.startField]);
                    const endDate = parsePlanDate(activePlan[phase.endField]);
                    const position = getPhasePosition(startDate, endDate);
                    
                    if (position.width === "0%") return null;
                    
                    return (
                      <div
                        key={phase.key}
                        className={`absolute h-7 rounded ${phase.color} flex items-center justify-center overflow-hidden shadow-sm`}
                        style={{
                          left: position.left,
                          width: position.width,
                          top: '50%',
                          transform: 'translateY(-50%)',
                        }}
                      >
                        <div className="text-white font-medium px-2 truncate text-xs">
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
      <div className="mt-6">
        <h3 className="text-base font-semibold text-gray-800 mb-3">Phase Legend</h3>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {phases.map((phase) => (
            <div key={phase.key} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-sm ${phase.color}`} />
              <span className="text-sm font-medium text-gray-700">{phase.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

