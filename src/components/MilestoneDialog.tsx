import { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Milestone } from "@/types";
import { toast } from "@/hooks/use-toast";

interface MilestoneDialogProps {
  milestone: Milestone | null;
  isOpen: boolean;
  onClose: () => void;
}

const MilestoneDialog = ({ milestone, isOpen, onClose }: MilestoneDialogProps) => {
  const { addMilestone, updateMilestone } = useData();
  const [formData, setFormData] = useState({
    name: "",
    date: new Date(),
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    if (milestone) {
      setFormData({
        name: milestone.name,
        date: milestone.date,
      });
    } else {
      setFormData({
        name: "",
        date: new Date(),
      });
    }
  }, [milestone, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Milestone name is required",
        variant: "destructive",
      });
      return;
    }

    if (milestone) {
      updateMilestone(milestone.id, formData);
      toast({
        title: "Success",
        description: "Milestone updated successfully",
      });
    } else {
      addMilestone(formData);
      toast({
        title: "Success",
        description: "Milestone added successfully",
      });
    }
    
    onClose();
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, date }));
      setIsCalendarOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {milestone ? "Edit Milestone" : "Add New Milestone"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Milestone Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter milestone name"
              required
            />
          </div>
          
          <div>
            <Label>Date *</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  month={formData.date}
                  onSelect={handleDateSelect}
                  initialFocus
                  numberOfMonths={2}
                  captionLayout="dropdown"
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {milestone ? "Update" : "Add"} Milestone
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MilestoneDialog;
