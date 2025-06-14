import React from "react";
import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, History, Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import RoadmapPlanDialog from "@/components/RoadmapPlanDialog";
import { format } from "date-fns";
import classNames from "clsx";

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

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search capabilities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="overflow-x-auto rounded-lg bg-white p-2 shadow">
          <table className="min-w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white border-b px-2 py-1 text-left w-40">Capability</th>
                {DATE_FIELDS.map(field => (
                  <th key={field.key} className="border-b px-2 py-1">
                    {field.label}
                  </th>
                ))}
                <th className="border-b px-2 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {filteredCapabilities.map(cap => {
                const activePlan = getActiveRoadmapPlan(cap.id);
                const history = getRoadmapHistory(cap.id);
                const showingHistory = showHistory === cap.id && history.length > 1;

                if (!activePlan && history.length === 0) return null;

                // Render active plan row
                const renderPlanRow = (plan, options: { faded?: boolean; versionLabel?: string } = {}) => (
                  <tr
                    key={plan.id}
                    className={classNames(
                      options.faded ? "opacity-60" : "",
                      options.versionLabel ? "bg-gray-50" : ""
                    )}
                  >
                    <td className="whitespace-nowrap font-medium px-2 py-1 border-r border-gray-200 text-sm">
                      {cap.name}
                      {options.versionLabel && (
                        <span className="ml-2 text-xs text-gray-400 align-middle">
                          {options.versionLabel}
                        </span>
                      )}
                    </td>
                    {DATE_FIELDS.map(field => (
                      <td key={field.key} className="border border-gray-100 px-2 py-1 text-center">
                        {plan[field.key] && plan[field.key] instanceof Date
                          ? format(plan[field.key], "MMM dd, yyyy")
                          : "-"}
                      </td>
                    ))}
                    <td className="text-center">
                      {!options.versionLabel && (
                        activePlan
                          ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openCreatePlan(cap.id)}
                                className="px-2 mr-1"
                              >
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Button>
                              {history.length > 1 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleHistory(cap.id)}
                                  className="pl-2"
                                >
                                  <History className="h-4 w-4 mr-1" />
                                  {showingHistory ? "Hide" : "Show"} History
                                </Button>
                              )}
                            </>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => openCreatePlan(cap.id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Create Plan
                            </Button>
                          )
                      )}
                    </td>
                  </tr>
                );

                return (
                  <React.Fragment key={cap.id}>
                    {activePlan && renderPlanRow(activePlan)}
                    {showingHistory &&
                      history.slice(1).map(plan =>
                        renderPlanRow(plan, { faded: true, versionLabel: `v${plan.version}` })
                      )
                    }
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <RoadmapPlanDialog
        capabilityId={selectedCapabilityId}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  );
};

export default RoadmapManagement;
