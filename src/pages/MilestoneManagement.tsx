import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Edit, Trash2, Calendar } from "lucide-react";
import MilestoneDialog from "@/components/MilestoneDialog";
import { Milestone } from "@/types";
import { format, isAfter, isBefore, addDays } from "date-fns";

const MilestoneManagement = () => {
  const { data, deleteMilestone } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredMilestones = data.milestones.filter((milestone) =>
    milestone.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedMilestones = filteredMilestones.sort((a, b) => a.date.getTime() - b.date.getTime());

  const handleEdit = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this milestone?")) {
      deleteMilestone(id);
    }
  };

  const handleAddNew = () => {
    setSelectedMilestone(null);
    setIsDialogOpen(true);
  };

  const getMilestoneStatus = (date: Date) => {
    const today = new Date();
    const milestone = new Date(date);
    
    if (isBefore(milestone, today)) {
      return { status: "Past", color: "bg-gray-100 text-gray-800" };
    } else if (isBefore(milestone, addDays(today, 30))) {
      return { status: "Upcoming", color: "bg-yellow-100 text-yellow-800" };
    } else {
      return { status: "Future", color: "bg-blue-100 text-blue-800" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Removed page headline/description - now handled by Layout */}
      {/* Right-aligned add button */}
      <div className="flex justify-end mb-2">
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Milestone
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search milestones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-gray-600">
              Showing {filteredMilestones.length} of {data.milestones.length} milestones
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones List */}
      <div className="space-y-4">
        {sortedMilestones.map((milestone) => {
          const { status, color } = getMilestoneStatus(milestone.date);
          
          return (
            <Card key={milestone.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {milestone.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {format(milestone.date, "MMMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>
                      {status}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(milestone)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(milestone.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredMilestones.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No milestones found</h3>
              <p className="text-sm">
                {data.milestones.length === 0 
                  ? "Get started by adding your first milestone"
                  : "Try adjusting your search criteria"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <MilestoneDialog
        milestone={selectedMilestone}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  );
};

export default MilestoneManagement;
