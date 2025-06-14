
import { format } from "date-fns";

interface TimelineHeaderProps {
  months: Date[];
  monthWidth: number;
  contentWidth: number;
}

export default function TimelineHeader({ months, monthWidth, contentWidth }: TimelineHeaderProps) {
  return (
    <div className="border-b bg-gray-50 p-4 sticky top-0 z-10">
      <div className="flex">
        {/* Capability column offset */}
        <div className="w-56 flex-shrink-0" />
        <div className="flex-1 relative">
          <div className="flex" style={{ minWidth: `${contentWidth}px` }}>
            {months.map((month) => (
              <div
                key={month.toISOString()}
                className="text-center text-sm font-medium text-gray-600 border-l border-gray-200 flex items-center justify-center"
                style={{
                  minWidth: `${monthWidth}px`,
                  width: `${monthWidth}px`,
                }}
              >
                {format(month, "MMM yyyy")}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
