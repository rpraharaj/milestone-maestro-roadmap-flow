
import React, { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
    >
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">
              {capability ? "Edit Capability" : "Add New Capability"}
            </h2>
            <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
              ×
            </Button>
          </div>
          
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
                <select
                  id="milestone"
                  value={formData.milestone}
                  onChange={(e) => setFormData(prev => ({ ...prev, milestone: e.target.value }))}
                  disabled={isSubmitting}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">No milestone</option>
                  {data.milestones.map((milestone) => (
                    <option key={milestone.id} value={milestone.name}>
                      {milestone.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Capability['status'] }))}
                  disabled={isSubmitting}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="ragStatus">RAG Status</Label>
                <select
                  id="ragStatus"
                  value={formData.ragStatus}
                  onChange={(e) => setFormData(prev => ({ ...prev, ragStatus: e.target.value as Capability['ragStatus'] }))}
                  disabled={isSubmitting}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="Red">Red</option>
                  <option value="Amber">Amber</option>
                  <option value="Green">Green</option>
                </select>
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
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : capability ? "Update" : "Add"} Capability
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SimpleCapabilityDialog;
