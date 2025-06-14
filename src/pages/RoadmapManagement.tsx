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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import RoadmapPlanDialog from "@/components/RoadmapPlanDialog";
import { format } from "date-fns";
import classNames from "clsx";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

const DATE_FIELDS = [
  { key: "requirementStartDate", label: "Req Start" },
  { key: "requirementEndDate", label: "Req End" },
  { key: "designStartDate", label: "Design Start" },
  { key: "designEndDate", label: "Design End" },
  { key: "devStartDate", label: "Dev Start" },
  { key: "devEndDate", label: "Dev End" },
  { key: "cstStartDate", label: "CST Start" },
  { key: "cstEndDate", label: "CST End" },
  { key: "uatStartDate", label: "UAT Start" },
  { key: "uatEndDate", label: "UAT End" },
];

const RoadmapManagement = () => {
  const { data, getActiveRoadmapPlan, getRoadmapHistory, deleteRoadmapPlan } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCapabilityId, setSelectedCapabilityId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showHistory, setShowHistory] = useState<string | null>(null);

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
    toast({
      title: "Plan Deleted",
      description: `Roadmap plan v${planVersion} for ${capabilityName} has been deleted.`,
    });
  };

  /** Only pass the expected props to <TableRow> and use versionLabel/faded as option flags */
  const renderPlanRow = (
    cap,
    plan,
    {
      faded = false,
      versionLabel = null,
    }: { faded?: boolean; versionLabel?: string | null } = {}
  ) => (
    <TableRow
      key={plan.id + (versionLabel || "active")}
      className={classNames(
        "transition-all duration-200 border-b",
        faded
          ? "bg-gray-50/50 text-gray-600"
          : "hover:bg-gray-50/50 hover:shadow-sm",
        versionLabel && "border-l-2 border-gray-300"
      )}
    >
      <TableCell className="font-medium flex flex-row gap-2 items-center sticky left-0 z-10 bg-white/95 backdrop-blur-sm min-w-[160px] py-2 px-3">
        <span className="truncate">{cap.name}</span>
        {versionLabel && (
          <Badge
            variant="outline"
            className="text-xs border-gray-400 bg-gray-50 text-gray-700 px-1.5 py-0.5"
          >
            {versionLabel}
          </Badge>
        )}
      </TableCell>
      {DATE_FIELDS.map((field) => (
        <TableCell key={field.key} className="text-center text-sm py-2 px-2">
          {plan[field.key] && plan[field.key] instanceof Date
            ? format(plan[field.key], "MMM dd, yyyy")
            : "-"}
        </TableCell>
      ))}
      <TableCell className="text-center py-2 px-2">
        {plan && (
          <div className="flex flex-row gap-1 items-center justify-center">
            {!versionLabel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openCreatePlan(cap.id)}
                className="h-8 w-8 p-0"
                title="Edit Plan"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  title="Delete Plan"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Roadmap Plan</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this roadmap plan{versionLabel ? ` (${versionLabel})` : ''} for "{cap.name}"? 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeletePlan(plan.id, plan.version, cap.name)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete Plan
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {!versionLabel && getRoadmapHistory(cap.id).length > 1 && (
              <Button
                variant={showHistory === cap.id ? "secondary" : "outline"}
                size="sm"
                onClick={() => toggleHistory(cap.id)}
                className={classNames(
                  "h-8 w-8 p-0",
                  showHistory === cap.id
                    ? "ring-1 ring-gray-300"
                    : ""
                )}
                title={showHistory === cap.id ? "Hide History" : "Show History"}
              >
                <History className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-4 p-4">
      {/* Search filter */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search capabilities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setSearchTerm("")}
              size="sm"
              className="h-9"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto border-t">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                  <TableHead className="sticky left-0 bg-gray-50/90 backdrop-blur-sm z-20 min-w-[160px] border-r font-semibold text-gray-700 py-3">
                    Capability
                  </TableHead>
                  {DATE_FIELDS.map((field) => (
                    <TableHead key={field.key} className="text-center font-semibold text-gray-700 py-3 px-2 text-xs">
                      {field.label}
                    </TableHead>
                  ))}
                  <TableHead className="w-40 text-center font-semibold text-gray-700 py-3">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCapabilities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={DATE_FIELDS.length + 2} className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-gray-300" />
                        <span>No capabilities found</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {filteredCapabilities.map((cap) => {
                  const activePlan = getActiveRoadmapPlan(cap.id);
                  const history = getRoadmapHistory(cap.id);
                  const showingHistory = showHistory === cap.id && history.length > 1;

                  // Always render a row, even if no plan exists
                  if (!activePlan && history.length === 0) {
                    return (
                      <TableRow key={cap.id} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium flex flex-row gap-2 items-center sticky left-0 z-10 bg-white/95 backdrop-blur-sm min-w-[160px] py-2 px-3">
                          <span className="truncate">{cap.name}</span>
                        </TableCell>
                        {DATE_FIELDS.map((field) => (
                          <TableCell key={field.key} className="text-center text-sm py-2 px-2 text-gray-400">-</TableCell>
                        ))}
                        <TableCell className="text-center py-2 px-2">
                          <Button
                            size="sm"
                            onClick={() => openCreatePlan(cap.id)}
                            className="h-8 px-3 text-xs"
                            title="Create Plan"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Create Plan
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return (
                    <React.Fragment key={cap.id}>
                      {activePlan && renderPlanRow(cap, activePlan)}
                      {showingHistory &&
                        history.slice(1).map((plan) =>
                          renderPlanRow(cap, plan, {
                            faded: true,
                            versionLabel: `v${plan.version}`,
                          })
                        )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for plan management */}
      <RoadmapPlanDialog
        capabilityId={selectedCapabilityId}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  );
};

export default RoadmapManagement;
