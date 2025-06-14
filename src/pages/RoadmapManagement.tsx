
import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, History, Calendar } from "lucide-react";
import RoadmapPlanDialog from "@/components/RoadmapPlanDialog";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";

const PHASES = [
  { key: "requirement", label: "Requirements", startField: "requirementStartDate", endField: "requirementEndDate" },
  { key: "design", label: "Design", startField: "designStartDate", endField: "designEndDate" },
  { key: "dev", label: "Development", startField: "devStartDate", endField: "devEndDate" },
  { key: "cst", label: "CST", startField: "cstStartDate", endField: "cstEndDate" },
  { key: "uat", label: "UAT", startField: "uatStartDate", endField: "uatEndDate" },
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

  const handleCreatePlan = (capabilityId: string) => {
    setSelectedCapabilityId(capabilityId);
    setIsDialogOpen(true);
  };

  const handleEditPlan = (capabilityId: string) => {
    setSelectedCapabilityId(capabilityId);
    setIsDialogOpen(true);
  };

  const toggleHistory = (capabilityId: string) => {
    setShowHistory(showHistory === capabilityId ? null : capabilityId);
  };

  return (
    <div className="space-y-6">
      {/* Search */}
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

      {/* Capabilities & Plans Table */}
      <div className="rounded-lg shadow overflow-x-auto bg-white">
        <Table>
          <TableCaption>
            {filteredCapabilities.length === 0
              ? (
                <span className="flex flex-col items-center py-8 text-gray-500">
                  <Calendar className="h-8 w-8 mb-2 opacity-50" />
                  {data.capabilities.length === 0
                    ? "Create capabilities first to manage their roadmaps"
                    : "No capabilities found. Try adjusting your search."}
                </span>
              )
              : ""}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Capability</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Workstream Lead</TableHead>
              {PHASES.map(phase => (
                <TableHead key={phase.key} className="min-w-[120px]">{phase.label}</TableHead>
              ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCapabilities.map(capability => {
              const activePlan = getActiveRoadmapPlan(capability.id);
              const history = getRoadmapHistory(capability.id);

              return (
                <TableRow key={capability.id} className="bg-white hover:bg-gray-50 transition-colors">
                  {/* Capability name */}
                  <TableCell>
                    <span className="font-medium text-gray-900">{capability.name}</span>
                  </TableCell>
                  {/* RAG & overall status */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          capability.ragStatus === 'Red' ? 'border-red-200 text-red-800 bg-red-50' :
                          capability.ragStatus === 'Amber' ? 'border-amber-200 text-amber-800 bg-amber-50' :
                          'border-green-200 text-green-800 bg-green-50'
                        }
                      >
                        {capability.ragStatus}
                      </Badge>
                      <span className="text-xs text-gray-500">{capability.status}</span>
                    </div>
                  </TableCell>
                  {/* Workstream Lead */}
                  <TableCell>
                    <span className="text-xs text-gray-700">{capability.workstreamLead}</span>
                  </TableCell>

                  {/* Plan details - for each phase */}
                  {PHASES.map(phase => (
                    <TableCell key={phase.key}>
                      {activePlan ? (
                        <span className="block text-xs">
                          <span className="font-medium">{format(activePlan[phase.startField], "MMM dd")}</span>
                          {" - "}
                          <span className="font-medium">{format(activePlan[phase.endField], "MMM dd")}</span>
                        </span>
                      ) : (
                        <span className="text-gray-300 italic text-xs">--</span>
                      )}
                    </TableCell>
                  ))}

                  {/* Actions */}
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      {activePlan ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPlan(capability.id)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          {history.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleHistory(capability.id)}
                              className="pl-2"
                            >
                              <History className="h-4 w-4 mr-2" />
                              {showHistory === capability.id ? "Hide" : "Show"} History
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleCreatePlan(capability.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Plan
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {/* Plan History: Inline expandable rows under the main row */}
            {filteredCapabilities.map(capability => {
              const history = getRoadmapHistory(capability.id);
              const show = showHistory === capability.id && history.length > 1;
              if (!show) return null;

              return (
                <TableRow key={capability.id + "-history"}>
                  <TableCell colSpan={PHASES.length + 4} className="!bg-gray-50 px-6">
                    <div className="space-y-1">
                      <div className="font-medium text-sm text-gray-700 mb-2">
                        Plan History
                      </div>
                      <div className="flex flex-col gap-2">
                        {history.slice(1).map(plan => (
                          <div key={plan.id} className="bg-white border rounded-lg shadow-sm p-3">
                            <div className="flex flex-wrap gap-3 items-center mb-1">
                              <span className="text-xs text-gray-700 font-medium">v{plan.version}</span>
                              <span className="text-xs text-gray-400">
                                {format(plan.createdAt, "MMM dd, yyyy 'at' HH:mm")}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                              {PHASES.map(phase => (
                                <div key={phase.key}>
                                  <span className="font-medium">{phase.label}: </span>
                                  <span>{format(plan[phase.startField], "MMM dd")} - {format(plan[phase.endField], "MMM dd")}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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
