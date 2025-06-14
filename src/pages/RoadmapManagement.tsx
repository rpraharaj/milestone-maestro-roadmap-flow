
import React, { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, History, Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import RoadmapPlanDialog from "@/components/RoadmapPlanDialog";
import { format } from "date-fns";
import classNames from "clsx";
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
  const { data, getActiveRoadmapPlan, getRoadmapHistory } = useData();
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
        "transition-shadow group",
        faded
          ? "bg-gray-50"
          : "hover:bg-blue-50/80 hover:shadow",
        versionLabel && "border-l-4 border-blue-200"
      )}
    >
      <TableCell className="font-medium flex flex-row gap-2 items-center sticky left-0 z-10 bg-white/90 min-w-[180px] !pl-2">
        {cap.name}
        {versionLabel && (
          <Badge
            variant="outline"
            className="ml-2 text-xs border-blue-400 bg-blue-50 text-blue-700"
          >
            {versionLabel}
          </Badge>
        )}
      </TableCell>
      {DATE_FIELDS.map((field) => (
        <TableCell key={field.key} className="text-center">
          {plan[field.key] && plan[field.key] instanceof Date
            ? format(plan[field.key], "MMM dd, yyyy")
            : "-"}
        </TableCell>
      ))}
      <TableCell className="text-center">
        {!versionLabel && (
          plan
            ? (
              <div className="flex flex-wrap gap-2 items-center justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openCreatePlan(cap.id)}
                  className="px-2"
                >
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
                {getRoadmapHistory(cap.id).length > 1 && (
                  <Button
                    variant={showHistory === cap.id ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => toggleHistory(cap.id)}
                    className={classNames(
                      "px-2",
                      showHistory === cap.id
                        ? "ring-2 ring-blue-200"
                        : ""
                    )}
                  >
                    <History className="h-4 w-4 mr-1" />
                    {showHistory === cap.id ? "Hide" : "Show"} History
                  </Button>
                )}
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => openCreatePlan(cap.id)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Plan
              </Button>
            )
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      {/* Search filter */}
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-5 flex items-center gap-2 bg-gray-50 rounded-t-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search capabilities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-md ring-1 ring-gray-200"
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => setSearchTerm("")}
            className="ml-2"
            size="sm"
          >
            Clear
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg border border-gray-200 overflow-hidden">
        <CardContent className="px-2 py-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="sticky left-0 bg-gray-50 z-20 min-w-[180px] border-r">Capability</TableHead>
                  {DATE_FIELDS.map((field) => (
                    <TableHead key={field.key} className="text-center">{field.label}</TableHead>
                  ))}
                  <TableHead className="w-48" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCapabilities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={DATE_FIELDS.length + 2} className="text-center py-8 text-gray-400">
                      No capabilities found.
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
                      <TableRow key={cap.id}>
                        <TableCell className="font-medium flex flex-row gap-2 items-center sticky left-0 z-10 bg-white/90 min-w-[180px] !pl-2">
                          {cap.name}
                        </TableCell>
                        {DATE_FIELDS.map((field) => (
                          <TableCell key={field.key} className="text-center">-</TableCell>
                        ))}
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            onClick={() => openCreatePlan(cap.id)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            <Plus className="h-4 w-4 mr-1" />
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
