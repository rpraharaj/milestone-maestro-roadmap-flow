
import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Cog, Columns } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

interface ColumnVisibilitySettingsProps {
  visibleColumns: {
    rag: boolean;
    status: boolean;
    history: boolean;
    milestone: boolean;
  };
  onColumnToggle: (column: 'rag' | 'status' | 'history' | 'milestone') => void;
}

export default function ColumnVisibilitySettings({
  visibleColumns,
  onColumnToggle,
}: ColumnVisibilitySettingsProps) {
  const isMobile = useIsMobile();
  
  const columns = [
    { key: 'rag' as const, label: 'RAG', priority: 'High' },
    { key: 'status' as const, label: 'Status', priority: 'Medium' },
    { key: 'milestone' as const, label: 'Milestone', priority: 'Medium' },
    { key: 'history' as const, label: 'History', priority: 'Low' },
  ];

  const visibleCount = Object.values(visibleColumns).filter(Boolean).length;
  const totalColumns = columns.length + 1; // +1 for always-visible Capability column

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size={isMobile ? "sm" : "icon"}
          className={isMobile ? "h-8 px-2" : "h-8 w-8"}
          title="Column Settings"
        >
          <Columns className="h-4 w-4" />
          {isMobile && (
            <>
              <span className="ml-1 text-xs">Cols</span>
              <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                {visibleCount + 1}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={isMobile ? "w-56" : "w-48"} align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Show Columns</h4>
            <Badge variant="outline" className="text-xs">
              {visibleCount + 1}/{totalColumns}
            </Badge>
          </div>
          
          {/* Always visible capability column */}
          <div className="flex items-center space-x-2 opacity-50">
            <Checkbox checked={true} disabled />
            <label className="text-sm font-medium leading-none">
              Capability
            </label>
            <Badge variant="secondary" className="text-xs ml-auto">
              Always
            </Badge>
          </div>
          
          <div className="border-t pt-2 space-y-2">
            {columns.map((column) => (
              <div key={column.key} className="flex items-center space-x-2">
                <Checkbox
                  id={column.key}
                  checked={visibleColumns[column.key]}
                  onCheckedChange={() => onColumnToggle(column.key)}
                />
                <label
                  htmlFor={column.key}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                >
                  {column.label}
                </label>
                {isMobile && (
                  <Badge 
                    variant={column.priority === 'High' ? 'default' : column.priority === 'Medium' ? 'secondary' : 'outline'} 
                    className="text-xs"
                  >
                    {column.priority}
                  </Badge>
                )}
              </div>
            ))}
          </div>
          
          {isMobile && (
            <div className="border-t pt-2 text-xs text-gray-500">
              <p>Tip: Hide less important columns to see more timeline content on mobile.</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
