import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, History, Calendar } from "lucide-react";
import RoadmapPlanDialog from "@/components/RoadmapPlanDialog";
import { RoadmapPlan } from "@/types";
import { format } from "date-fns";

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
      {/* Removed page headline/description - now handled by Layout */}
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

      {/* Capabilities with Roadmap Plans */}
      <div className="space-y-4">
        {filteredCapabilities.map((capability) => {
          const activePlan = getActiveRoadmapPlan(capability.id);
          const history = getRoadmapHistory(capability.id);
          const isHistoryVisible = showHistory === capability.id;

          return (
            <Card key={capability.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{capability.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Lead: {capability.workstreamLead} | Status: {capability.status}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {history.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleHistory(capability.id)}
                      >
                        <History className="h-4 w-4 mr-2" />
                        History ({history.length})
                      </Button>
                    )}
                    {activePlan ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPlan(capability.id)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Plan
                      </Button>
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
                </div>
              </CardHeader>
              
              {activePlan && (
                <CardContent className="pt-0">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Current Plan (v{activePlan.version})</h4>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Requirements:</span>
                        <p>{format(activePlan.requirementStartDate, "MMM dd")} - {format(activePlan.requirementEndDate, "MMM dd")}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Design:</span>
                        <p>{format(activePlan.designStartDate, "MMM dd")} - {format(activePlan.designEndDate, "MMM dd")}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Development:</span>
                        <p>{format(activePlan.devStartDate, "MMM dd")} - {format(activePlan.devEndDate, "MMM dd")}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">CST:</span>
                        <p>{format(activePlan.cstStartDate, "MMM dd")} - {format(activePlan.cstEndDate, "MMM dd")}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">UAT:</span>
                        <p>{format(activePlan.uatStartDate, "MMM dd")} - {format(activePlan.uatEndDate, "MMM dd")}</p>
                      </div>
                    </div>
                  </div>

                  {/* History */}
                  {isHistoryVisible && history.length > 1 && (
                    <div className="mt-4 space-y-3">
                      <h4 className="font-medium text-gray-900">Plan History</h4>
                      {history.slice(1).map((plan) => (
                        <div key={plan.id} className="bg-gray-50 border-l-4 border-gray-300 rounded-r-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">Version {plan.version}</span>
                            <span className="text-xs text-gray-500">
                              {format(plan.createdAt, "MMM dd, yyyy 'at' HH:mm")}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs text-gray-600">
                            <div>
                              <span className="font-medium">Requirements:</span>
                              <p>{format(plan.requirementStartDate, "MMM dd")} - {format(plan.requirementEndDate, "MMM dd")}</p>
                            </div>
                            <div>
                              <span className="font-medium">Design:</span>
                              <p>{format(plan.designStartDate, "MMM dd")} - {format(plan.designEndDate, "MMM dd")}</p>
                            </div>
                            <div>
                              <span className="font-medium">Development:</span>
                              <p>{format(plan.devStartDate, "MMM dd")} - {format(plan.devEndDate, "MMM dd")}</p>
                            </div>
                            <div>
                              <span className="font-medium">CST:</span>
                              <p>{format(plan.cstStartDate, "MMM dd")} - {format(plan.cstEndDate, "MMM dd")}</p>
                            </div>
                            <div>
                              <span className="font-medium">UAT:</span>
                              <p>{format(plan.uatStartDate, "MMM dd")} - {format(plan.uatEndDate, "MMM dd")}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
              
              {!activePlan && (
                <CardContent className="pt-0">
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No roadmap plan created yet</p>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {filteredCapabilities.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No capabilities found</h3>
              <p className="text-sm">
                {data.capabilities.length === 0 
                  ? "Create capabilities first to manage their roadmaps"
                  : "Try adjusting your search criteria"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <RoadmapPlanDialog
        capabilityId={selectedCapabilityId}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  );
};

export default RoadmapManagement;

// --- NOTE: This file is now quite long. You may want to consider refactoring it into smaller components for better maintainability.
