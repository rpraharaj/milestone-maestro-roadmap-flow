
import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, History, Plus, Edit } from "lucide-react";
import RoadmapTimelineTable from "@/components/roadmap/RoadmapTimelineTable";
import { Button } from "@/components/ui/button";
import RoadmapPlanDialog from "@/components/RoadmapPlanDialog";

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
          <RoadmapTimelineTable
            capabilities={filteredCapabilities}
            getActiveRoadmapPlan={getActiveRoadmapPlan}
            getRoadmapHistory={getRoadmapHistory}
            showHistoryFor={showHistory}
          />
        </div>
        {/* Actions panel */}
        <div className="flex flex-wrap gap-3 items-center">
          {filteredCapabilities.map(cap => {
            const plan = getActiveRoadmapPlan(cap.id);
            const history = getRoadmapHistory(cap.id);
            return (
              <div key={cap.id} className="flex items-center gap-2">
                <span className="text-sm font-medium">{cap.name}</span>
                {plan ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCreatePlan(cap.id)}
                      className="px-2"
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
                        {showHistory === cap.id ? "Hide" : "Show"} History
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
                )}
              </div>
            );
          })}
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
