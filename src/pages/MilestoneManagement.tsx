
import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Edit, Trash2, Calendar } from "lucide-react";
import { CollapsibleFilter } from "@/components/ui/collapsible-filter";
import MilestoneDialog from "@/components/MilestoneDialog";
import { Milestone } from "@/types";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

const MilestoneManagement = () => {
  const { data, deleteMilestone } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isMobile = useIsMobile();

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
      return { status: "Future", color: "bg-gray-200 text-gray-800" };
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Desktop add button - only show on desktop */}
      {!isMobile && (
        <div className="flex justify-end mb-2">
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Milestone
          </Button>
        </div>
      )}

      {/* Mobile Floating Action Button - only show on mobile */}
      {isMobile && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button 
            onClick={handleAddNew}
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-black hover:bg-gray-800"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Collapsible Search Section */}
      <CollapsibleFilter 
        title="Search & Filter" 
        activeFiltersCount={searchTerm ? 1 : 0}
        defaultCollapsed={true}
      >
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
          <div className={`text-sm text-gray-600 ${isMobile ? 'text-xs' : ''}`}>
            Showing {filteredMilestones.length} of {data.milestones.length} milestones
          </div>
        </div>
      </CollapsibleFilter>

      {/* Milestones List */}
      <div className="space-y-3 md:space-y-4">
        {sortedMilestones.map((milestone) => {
          const { status, color } = getMilestoneStatus(milestone.date);
          
          return (
            <Card key={milestone.id} className="hover:shadow-md transition-shadow">
              <CardContent className={isMobile ? "p-4" : "p-6"}>
                <div className={`flex items-center justify-between ${isMobile ? 'flex-col space-y-3' : ''}`}>
                  <div className={`flex items-center space-x-3 ${isMobile ? 'w-full' : 'space-x-4'}`}>
                    <div className={`${isMobile ? 'p-2' : 'p-3'} bg-gray-100 rounded-full flex-shrink-0`}>
                      <Calendar className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'} text-gray-600`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 truncate`}>
                        {milestone.name}
                      </h3>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                        {format(milestone.date, "MMMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center ${isMobile ? 'w-full justify-between' : 'space-x-2'}`}>
                    <span className={`px-2 py-1 rounded-full ${isMobile ? 'text-xs' : 'text-xs'} font-medium ${color} ${isMobile ? 'px-3' : ''}`}>
                      {status}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size={isMobile ? "sm" : "sm"}
                        onClick={() => handleEdit(milestone)}
                        className={isMobile ? "h-10 w-10 p-0" : ""}
                      >
                        <Edit className="h-4 w-4" />
                        {isMobile && <span className="sr-only">Edit milestone</span>}
                      </Button>
                      <Button
                        variant="ghost"
                        size={isMobile ? "sm" : "sm"}
                        onClick={() => handleDelete(milestone.id)}
                        className={isMobile ? "h-10 w-10 p-0" : ""}
                      >
                        <Trash2 className="h-4 w-4" />
                        {isMobile && <span className="sr-only">Delete milestone</span>}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredMilestones.length === 0 && (
        <Card>
          <CardContent className={`${isMobile ? 'p-8' : 'p-12'} text-center`}>
            <div className="text-gray-500">
              <Calendar className={`${isMobile ? 'h-8 w-8' : 'h-12 w-12'} mx-auto mb-4 opacity-50`} />
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium mb-2`}>No milestones found</h3>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
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
