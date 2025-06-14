
import React, { useState, useEffect } from "react";
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
  DialogFooter,
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

interface SimpleCapabilityDialogProps {
  capability: Capability | null;
  isOpen: boolean;
  onClose: () => void;
}

const SimpleCapabilityDialog = ({ capability, isOpen, onClose }: SimpleCapabilityDialogProps) => {
  const { addCapability, updateCapability, data } = useData();
  const [formData, setFormData] = useState({
    name: "",
    workstreamLead: "",
    sme: "",
    ba: "",
    milestone: "",
    status: "Not Started" as Capability['status'],
    ragStatus: "Green" as Capability['ragStatus'],
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (capability) {
      setFormData({
        name: capability.name || "",
        workstreamLead: capability.workstreamLead || "",
        sme: capability.sme || "",
        ba: capability.ba || "",
        milestone: capability.milestone || "",
        status: capability.status || "Not Started",
        ragStatus: capability.ragStatus || "Green",
        notes: capability.notes || "",
      });
    } else {
      setFormData({
        name: "",
        workstreamLead: "",
        sme: "",
        ba: "",
        milestone: "",
        status: "Not Started",
        ragStatus: "Green",
        notes: "",
      });
    }
  }, [capability, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Capability name is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const preparedData = {
        name: formData.name.trim(),
        workstreamLead: formData.workstreamLead.trim(),
        sme: formData.sme.trim(),
        ba: formData.ba.trim(),
        milestone: formData.milestone,
        status: formData.status,
        ragStatus: formData.ragStatus,
        notes: formData.notes.trim(),
      };

      if (capability) {
        await updateCapability(capability.id, preparedData);
        toast({
          title: "Success",
          description: "Capability updated successfully",
        });
      } else {
        await addCapability(preparedData);
        toast({
          title: "Success",
          description: "Capability added successfully",
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error in form submission:', error);
      toast({
        title: "Error",
        description: `Failed to ${capability ? 'update' : 'add'} capability. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter capability name"
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <Label htmlFor="workstreamLead">Workstream Lead</Label>
              <Input
                id="workstreamLead"
                value={formData.workstreamLead}
                onChange={(e) => setFormData(prev => ({ ...prev, workstreamLead: e.target.value }))}
                placeholder="Enter workstream lead"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <Label htmlFor="sme">SME</Label>
              <Input
                id="sme"
                value={formData.sme}
                onChange={(e) => setFormData(prev => ({ ...prev, sme: e.target.value }))}
                placeholder="Enter SME"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <Label htmlFor="ba">BA</Label>
              <Input
                id="ba"
                value={formData.ba}
                onChange={(e) => setFormData(prev => ({ ...prev, ba: e.target.value }))}
                placeholder="Enter BA"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <Label htmlFor="milestone">Milestone</Label>
              <Select
                value={formData.milestone}
                onValueChange={(value) => setFormData(prev => ({ ...prev, milestone: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select milestone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No milestone</SelectItem>
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
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Capability['status'] }))}
                disabled={isSubmitting}
              >
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
              <Select
                value={formData.ragStatus}
                onValueChange={(value) => setFormData(prev => ({ ...prev, ragStatus: value as Capability['ragStatus'] }))}
                disabled={isSubmitting}
              >
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
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter notes..."
                rows={4}
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : capability ? "Update" : "Add"} Capability
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleCapabilityDialog;
