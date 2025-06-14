
import React, { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronDown, ChevronRight, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface MobileTableColumn {
  key: string;
  label: string;
  priority: 'high' | 'medium' | 'low';
  width?: string;
  className?: string;
  hideOnMobile?: boolean;
}

interface MobileTableAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

interface MobileTableProps {
  columns: MobileTableColumn[];
  data: any[];
  actions?: (item: any) => MobileTableAction[];
  expandedContent?: (item: any) => React.ReactNode;
  keyField?: string;
  className?: string;
}

export const MobileTable: React.FC<MobileTableProps> = ({
  columns,
  data,
  actions,
  expandedContent,
  keyField = 'id',
  className,
}) => {
  const isMobile = useIsMobile();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Filter columns based on mobile priority
  const visibleColumns = isMobile 
    ? columns.filter(col => col.priority === 'high' && !col.hideOnMobile)
    : columns;

  const hiddenColumns = isMobile 
    ? columns.filter(col => col.priority !== 'high' || col.hideOnMobile)
    : [];

  return (
    <div className={cn("w-full", className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50/80">
              {expandedContent && (
                <th className="w-8 p-2"></th>
              )}
              {visibleColumns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "text-left font-semibold text-gray-700 p-3",
                    isMobile ? "text-sm py-4" : "text-xs",
                    column.className
                  )}
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
              {(actions || hiddenColumns.length > 0) && (
                <th className="w-16 text-center font-semibold text-gray-700 p-3">
                  {isMobile ? "Actions" : ""}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const itemId = item[keyField];
              const isExpanded = expandedRows.has(itemId);
              
              return (
                <React.Fragment key={itemId}>
                  <tr className={cn(
                    "border-b hover:bg-gray-50 transition-colors",
                    isMobile ? "h-16" : "h-12"
                  )}>
                    {expandedContent && (
                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(itemId)}
                          className="h-8 w-8 p-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    )}
                    {visibleColumns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          "p-3",
                          isMobile ? "text-sm" : "text-xs",
                          column.className
                        )}
                      >
                        {item[column.key]}
                      </td>
                    ))}
                    {(actions || hiddenColumns.length > 0) && (
                      <td className="p-2 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "p-0",
                                isMobile ? "h-10 w-10" : "h-8 w-8"
                              )}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end" 
                            className="w-48 bg-white border shadow-lg"
                            style={{ zIndex: 50 }}
                          >
                            {hiddenColumns.length > 0 && (
                              <DropdownMenuItem
                                onClick={() => toggleRow(itemId)}
                                className="flex items-center gap-2"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                {isExpanded ? "Hide Details" : "Show Details"}
                              </DropdownMenuItem>
                            )}
                            {actions?.(item).map((action, idx) => (
                              <DropdownMenuItem
                                key={idx}
                                onClick={action.onClick}
                                className={cn(
                                  "flex items-center gap-2",
                                  action.variant === 'destructive' && "text-red-600"
                                )}
                              >
                                {action.icon && <action.icon className="h-4 w-4" />}
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    )}
                  </tr>
                  {isExpanded && expandedContent && (
                    <tr>
                      <td 
                        colSpan={visibleColumns.length + (expandedContent ? 1 : 0) + (actions ? 1 : 0)}
                        className="p-0"
                      >
                        <div className="bg-gray-50 p-4 border-t">
                          {expandedContent(item)}
                        </div>
                      </td>
                    </tr>
                  )}
                  {isExpanded && hiddenColumns.length > 0 && !expandedContent && (
                    <tr>
                      <td 
                        colSpan={visibleColumns.length + (expandedContent ? 1 : 0) + (actions ? 1 : 0)}
                        className="p-0"
                      >
                        <div className="bg-gray-50 p-4 border-t">
                          <div className="grid grid-cols-1 gap-2">
                            {hiddenColumns.map((column) => (
                              <div key={column.key} className="flex justify-between">
                                <span className="font-medium text-gray-600">{column.label}:</span>
                                <span className="text-gray-900">{item[column.key]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
