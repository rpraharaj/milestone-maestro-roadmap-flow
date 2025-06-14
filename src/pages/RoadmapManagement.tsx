
import React, { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, History, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import RoadmapPlanDialog from "@/components/RoadmapPlanDialog";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { MobileTable } from "@/components/ui/mobile-table";
import { CollapsibleFilter } from "@/components/ui/collapsible-filter";
import { useIsMobile } from "@/hooks/use-mobile";

const DATE_FIELDS = [
  { key: "requirementStartDate", label: "Req Start", priority: "medium" as const },
  { key: "requirementEndDate", label: "Req End", priority: "low" as const },
  { key: "designStartDate", label: "Design Start", priority: "medium" as const },
  { key: "designEndDate", label: "Design End", priority: "low" as const },
  { key: "devStartDate", label: "Dev Start", priority: "high" as const },
  { key: "devEndDate", label: "Dev End", priority: "high" as const },
  { key: "cstStartDate", label: "CST Start", priority: "low" as const },
  { key: "cstEndDate", label: "CST End", priority: "low" as const },
  { key: "uatStartDate", label: "UAT Start", priority: "medium" as const },
  { key: "uatEndDate", label: "UAT End", priority: "medium" as const },
];

const RoadmapManagement = () => {
  const { data, getActiveRoadmapPlan, getRoadmapHistory, deleteRoadmapPlan } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCapabilityId, setSelectedCapabilityId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; planId: string; version: number; capabilityName: string }>({
    open: false,
    planId: "",
    version: 0,
    capabilityName: ""
  });
  const isMobile = useIsMobile();

  const filteredCapabilities = data.capabilities.filter((capability) =>
    capability.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreatePlan = (cid: string) => {
    setSelectedCapabilityId(cid);
    setIsDialogOpen(true);
  };

  const toggleHistory = (cid: string) => {
    setShowHistory(showHistory === cid ? null : cid);
  };

  const handleDeletePlan = (planId: string, planVersion: number, capabilityName: string) => {
    deleteRoadmapPlan(planId);
    setDeleteDialog({ open: false, planId: "", version: 0, capabilityName: "" });
    toast({
      title: "Plan Deleted",
      description: `Roadmap plan v${planVersion} for ${capabilityName} has been deleted.`,
    });
  };

  // Count active filters
  const activeFiltersCount = searchTerm ? 1 : 0;

  // Prepare table data
  const tableData = filteredCapabilities.flatMap((cap) => {
    const activePlan = getActiveRoadmapPlan(cap.id);
    const history = getRoadmapHistory(cap.id);
    const showingHistory = showHistory === cap.id && history.length > 1;

    if (!activePlan && history.length === 0) {
      return [{
        id: cap.id,
        capabilityName: cap.name,
        capabilityId: cap.id,
        hasActivePlan: false,
        ...DATE_FIELDS.reduce((acc, field) => ({ ...acc, [field.key]: "-" }), {}),
      }];
    }

    const rows = [];
    if (activePlan) {
      rows.push({
        id: activePlan.id,
        capabilityName: cap.name,
        capabilityId: cap.id,
        plan: activePlan,
        hasActivePlan: true,
        isActive: true,
        ...DATE_FIELDS.reduce((acc, field) => ({
          ...acc,
          [field.key]: activePlan[field.key] && activePlan[field.key] instanceof Date
            ? format(activePlan[field.key], "MMM dd, yyyy")
            : "-"
        }), {}),
      });
    }

    if (showingHistory) {
      history.slice(1).forEach(plan => {
        rows.push({
          id: plan.id,
          capabilityName: cap.name,
          capabilityId: cap.id,
          plan: plan,
          hasActivePlan: true,
          isActive: false,
          version: plan.version,
          ...DATE_FIELDS.reduce((acc, field) => ({
            ...acc,
            [field.key]: plan[field.key] && plan[field.key] instanceof Date
              ? format(plan[field.key], "MMM dd, yyyy")
              : "-"
          }), {}),
        });
      });
    }

    return rows;
  });

  const columns = [
    {
      key: "capabilityName",
      label: "Capability",
      priority: "high" as const,
      width: isMobile ? "40%" : "200px",
      className: "font-medium sticky left-0 bg-white z-10",
    },
    ...DATE_FIELDS.map(field => ({
      key: field.key,
      label: field.label,
      priority: field.priority,
      className: "text-center",
    })),
  ];

  const getRowActions = (item: any) => {
    const actions = [];
    
    if (!item.hasActivePlan) {
      actions.push({
        label: "Create Plan",
        icon: Plus,
        onClick: () => openCreatePlan(item.capabilityId),
      });
    } else {
      if (item.isActive) {
        actions.push({
          label: "Edit Plan",
          icon: Edit,
          onClick: () => openCreatePlan(item.capabilityId),
        });
      }
      
      actions.push({
        label: "Delete Plan",
        icon: Trash2,
        onClick: () => setDeleteDialog({
          open: true,
          planId: item.plan.id,
          version: item.plan.version,
          capabilityName: item.capabilityName
        }),
        variant: "destructive" as const,
      });

      if (item.isActive && getRoadmapHistory(item.capabilityId).length > 1) {
        actions.push({
          label: showHistory === item.capabilityId ? "Hide History" : "Show History",
          icon: History,
          onClick: () => toggleHistory(item.capabilityId),
        });
      }
    }

    return actions;
  };

  const getExpandedContent = (item: any) => {
    if (!item.hasActivePlan) return null;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">Plan Details:</span>
          {!item.isActive && (
            <Badge variant="outline" className="text-xs">
              v{item.version}
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {DATE_FIELDS.filter(field => field.priority !== 'high').map(field => (
            <div key={field.key}>
              <span className="text-gray-600">{field.label}:</span>
              <span className="ml-2">{item[field.key]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 p-4">
      {/* Search filter with collapsible container */}
      <CollapsibleFilter 
        title="Search & Filters" 
        activeFiltersCount={activeFiltersCount}
        defaultCollapsed={true}
      >
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search capabilities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={isMobile ? "pl-10 h-12 text-base" : "pl-10 h-9"}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setSearchTerm("")}
            size="sm"
            className={isMobile ? "h-12 px-4" : "h-9"}
          >
            Clear
          </Button>
        </div>
      </CollapsibleFilter>

      {/* Main table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <MobileTable
              columns={columns}
              data={tableData}
              actions={getRowActions}
              expandedContent={getExpandedContent}
              keyField="id"
            />
          </div>
        </CardContent>
      </Card>

      {/* Dialog for plan management */}
      <RoadmapPlanDialog
        capabilityId={selectedCapabilityId}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Roadmap Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this roadmap plan{deleteDialog.version > 1 ? ` (v${deleteDialog.version})` : ''} for "{deleteDialog.capabilityName}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeletePlan(deleteDialog.planId, deleteDialog.version, deleteDialog.capabilityName)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RoadmapManagement;
