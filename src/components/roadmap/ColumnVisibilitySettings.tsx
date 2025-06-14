
import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Cog } from "lucide-react";

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
  const columns = [
    { key: 'rag' as const, label: 'RAG' },
    { key: 'status' as const, label: 'Status' },
    { key: 'milestone' as const, label: 'Milestone' },
    { key: 'history' as const, label: 'History' },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Column Settings"
        >
          <Cog className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Show Columns</h4>
          <div className="space-y-2">
            {columns.map((column) => (
              <div key={column.key} className="flex items-center space-x-2">
                <Checkbox
                  id={column.key}
                  checked={visibleColumns[column.key]}
                  onCheckedChange={() => onColumnToggle(column.key)}
                />
                <label
                  htmlFor={column.key}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {column.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
