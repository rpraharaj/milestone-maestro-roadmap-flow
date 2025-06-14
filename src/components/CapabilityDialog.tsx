
import { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Capability } from "@/types";
import { toast } from "@/hooks/use-toast";

interface CapabilityDialogProps {
  capability: Capability | null;
  isOpen: boolean;
  onClose: () => void;
}

const CapabilityDialog = ({ capability, isOpen, onClose }: CapabilityDialogProps) => {
  const { addCapability, updateCapability, data } = useData();
  const [formData, setFormData] = useState({
    name: "",
    workstreamLead: "",
    sme: "",
    ba: "",
    milestone: "none",
    status: "Not Started" as Capability['status'],
    ragStatus: "Green" as Capability['ragStatus'],
    notes: "",
  });

  useEffect(() => {
    console.log('🔄 CapabilityDialog: Dialog opened, isOpen:', isOpen, 'capability:', capability);
    
    if (capability) {
      setFormData({
        name: capability.name,
        workstreamLead: capability.workstreamLead,
        sme: capability.sme,
        ba: capability.ba,
        milestone: capability.milestone && capability.milestone.length
          ? capability.milestone
          : "none",
        status: capability.status,
        ragStatus: capability.ragStatus,
        notes: capability.notes,
      });
    } else {
      setFormData({
        name: "",
        workstreamLead: "",
        sme: "",
        ba: "",
        milestone: "none",
        status: "Not Started",
        ragStatus: "Green",
        notes: "",
      });
    }
  }, [capability, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔄 CapabilityDialog: Form submitted with data:', formData);

    try {
      // Validate form data
      if (!formData.name || !formData.name.trim()) {
        console.error('❌ CapabilityDialog: Capability name is required');
        toast({
          title: "Error",
          description: "Capability name is required",
          variant: "destructive",
        });
        return;
      }

      // Prepare form data for submission
      const preparedFormData = {
        name: formData.name.trim(),
        workstreamLead: formData.workstreamLead.trim(),
        sme: formData.sme.trim(),
        ba: formData.ba.trim(),
        milestone: formData.milestone === "none" ? "" : formData.milestone,
        status: formData.status,
        ragStatus: formData.ragStatus,
        notes: formData.notes.trim(),
      };

      console.log('🔄 CapabilityDialog: Prepared data for submission:', preparedFormData);

      if (capability) {
        console.log('🔄 CapabilityDialog: Updating existing capability');
        await updateCapability(capability.id, preparedFormData);
        toast({
          title: "Success",
          description: "Capability updated successfully",
        });
      } else {
        console.log('🔄 CapabilityDialog: Adding new capability');
        await addCapability(preparedFormData);
        toast({
          title: "Success",
          description: "Capability added successfully",
        });
      }
      
      console.log('✅ CapabilityDialog: Operation completed successfully');
      onClose();
    } catch (error) {
      console.error('❌ CapabilityDialog: Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: `Failed to ${capability ? 'update' : 'add'} capability: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    console.log('🔄 CapabilityDialog: Field changed:', field, 'value:', value);
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {capability ? "Edit Capability" : "Add New Capability"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Capability Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter capability name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="workstreamLead">Workstream Lead</Label>
              <Input
                id="workstreamLead"
                value={formData.workstreamLead}
                onChange={(e) => handleChange("workstreamLead", e.target.value)}
                placeholder="Enter workstream lead"
              />
            </div>
            
            <div>
              <Label htmlFor="sme">SME</Label>
              <Input
                id="sme"
                value={formData.sme}
                onChange={(e) => handleChange("sme", e.target.value)}
                placeholder="Enter SME"
              />
            </div>
            
            <div>
              <Label htmlFor="ba">BA</Label>
              <Input
                id="ba"
                value={formData.ba}
                onChange={(e) => handleChange("ba", e.target.value)}
                placeholder="Enter BA"
              />
            </div>
            
            <div>
              <Label htmlFor="milestone">Milestone</Label>
              <Select value={formData.milestone} onValueChange={(value) => handleChange("milestone", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select milestone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No milestone</SelectItem>
                  {data.milestones.map((milestone) => (
                    <SelectItem key={milestone.id} value={milestone.name}>
                      {milestone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => handleChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="ragStatus">RAG Status</Label>
              <Select value={formData.ragStatus} onValueChange={(value: any) => handleChange("ragStatus", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Red">Red</SelectItem>
                  <SelectItem value="Amber">Amber</SelectItem>
                  <SelectItem value="Green">Green</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Enter notes..."
                rows={4}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {capability ? "Update" : "Add"} Capability
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CapabilityDialog;
