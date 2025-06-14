import { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
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
import { toast } from "@/hooks/use-toast";

interface RoadmapPlanDialogProps {
  capabilityId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const RoadmapPlanDialog = ({ capabilityId, isOpen, onClose }: RoadmapPlanDialogProps) => {
  const { addRoadmapPlan, updateRoadmapPlan, getActiveRoadmapPlan, data } = useData();
  const [formData, setFormData] = useState({
    requirementStartDate: new Date(),
    requirementEndDate: new Date(),
    designStartDate: new Date(),
    designEndDate: new Date(),
    devStartDate: new Date(),
    devEndDate: new Date(),
    cstStartDate: new Date(),
    cstEndDate: new Date(),
    uatStartDate: new Date(),
    uatEndDate: new Date(),
  });
  const [openCalendars, setOpenCalendars] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (capabilityId && isOpen) {
      const existingPlan = getActiveRoadmapPlan(capabilityId);
      if (existingPlan) {
        setFormData({
          requirementStartDate: existingPlan.requirementStartDate,
          requirementEndDate: existingPlan.requirementEndDate,
          designStartDate: existingPlan.designStartDate,
          designEndDate: existingPlan.designEndDate,
          devStartDate: existingPlan.devStartDate,
          devEndDate: existingPlan.devEndDate,
          cstStartDate: existingPlan.cstStartDate,
          cstEndDate: existingPlan.cstEndDate,
          uatStartDate: existingPlan.uatStartDate,
          uatEndDate: existingPlan.uatEndDate,
        });
      } else {
        // Set default dates with reasonable intervals
        const today = new Date();
        setFormData({
          requirementStartDate: today,
          requirementEndDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), // +2 weeks
          designStartDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000), // +15 days
          designEndDate: new Date(today.getTime() + 35 * 24 * 60 * 60 * 1000), // +5 weeks
          devStartDate: new Date(today.getTime() + 36 * 24 * 60 * 60 * 1000), // +36 days
          devEndDate: new Date(today.getTime() + 92 * 24 * 60 * 60 * 1000), // +92 days
          cstStartDate: new Date(today.getTime() + 93 * 24 * 60 * 60 * 1000), // +93 days
          cstEndDate: new Date(today.getTime() + 121 * 24 * 60 * 60 * 1000), // +121 days
          uatStartDate: new Date(today.getTime() + 122 * 24 * 60 * 60 * 1000), // +122 days
          uatEndDate: new Date(today.getTime() + 150 * 24 * 60 * 60 * 1000), // +150 days
        });
      }
    }
  }, [capabilityId, isOpen, getActiveRoadmapPlan]);

  const capability = capabilityId ? data.capabilities.find(c => c.id === capabilityId) : null;
  const existingPlan = capabilityId ? getActiveRoadmapPlan(capabilityId) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!capabilityId) return;

    if (existingPlan) {
      updateRoadmapPlan(capabilityId, { ...formData, isActive: true });
      toast({
        title: "Success",
        description: "Roadmap plan updated successfully (new version created)",
      });
    } else {
      addRoadmapPlan({ ...formData, capabilityId, isActive: true });
      toast({
        title: "Success",
        description: "Roadmap plan created successfully",
      });
    }
    
    onClose();
  };

  const handleDateSelect = (field: string, date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, [field]: date }));
      setOpenCalendars(prev => ({ ...prev, [field]: false }));
    }
  };

  const toggleCalendar = (field: string) => {
    setOpenCalendars(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const phases = [
    { key: 'requirement', label: 'Requirements', startField: 'requirementStartDate', endField: 'requirementEndDate' },
    { key: 'design', label: 'Design', startField: 'designStartDate', endField: 'designEndDate' },
    { key: 'dev', label: 'Development', startField: 'devStartDate', endField: 'devEndDate' },
    { key: 'cst', label: 'CST', startField: 'cstStartDate', endField: 'cstEndDate' },
    { key: 'uat', label: 'UAT', startField: 'uatStartDate', endField: 'uatEndDate' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {existingPlan ? "Update" : "Create"} Roadmap Plan
            {capability && <span className="text-gray-500 text-xs font-medium ml-2">- {capability.name}</span>}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col gap-2">
            {phases.map((phase) => (
              <div
                key={phase.key}
                className="border border-gray-200 rounded px-3 py-2 mb-1 bg-gray-50 flex flex-col md:flex-row md:items-center md:gap-2"
              >
                <span className="text-xs text-gray-700 w-28 mb-1 md:mb-0 font-semibold shrink-0">
                  {phase.label}
                </span>
                <div className="flex flex-1 flex-col sm:flex-row gap-2">
                  <div className="flex flex-1 items-center gap-1">
                    <Label className="text-xs w-[70px] shrink-0 pr-1">Start</Label>
                    <Popover
                      open={openCalendars[phase.startField]}
                      onOpenChange={() => toggleCalendar(phase.startField)}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full min-w-[112px] text-xs px-2 py-1 h-8 justify-start font-normal"
                        >
                          <CalendarIcon className="mr-1 h-3 w-3 text-gray-500" />
                          {format(formData[phase.startField as keyof typeof formData], "MMM dd, yyyy")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData[phase.startField as keyof typeof formData]}
                          month={formData[phase.startField as keyof typeof formData] as Date}
                          onSelect={(date) => handleDateSelect(phase.startField, date)}
                          initialFocus
                          numberOfMonths={2}
                          captionLayout="dropdown"
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex flex-1 items-center gap-1">
                    <Label className="text-xs w-[54px] shrink-0 pr-1">End</Label>
                    <Popover
                      open={openCalendars[phase.endField]}
                      onOpenChange={() => toggleCalendar(phase.endField)}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full min-w-[112px] text-xs px-2 py-1 h-8 justify-start font-normal"
                        >
                          <CalendarIcon className="mr-1 h-3 w-3 text-gray-500" />
                          {format(formData[phase.endField as keyof typeof formData], "MMM dd, yyyy")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData[phase.endField as keyof typeof formData]}
                          month={formData[phase.endField as keyof typeof formData] as Date}
                          onSelect={(date) => handleDateSelect(phase.endField, date)}
                          initialFocus
                          numberOfMonths={2}
                          captionLayout="dropdown"
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 px-4"
            >
              {existingPlan ? "Update Plan" : "Create Plan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoadmapPlanDialog;
