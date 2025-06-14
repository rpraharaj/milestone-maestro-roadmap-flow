
import React, { useState, useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { MobileTable } from "@/components/ui/mobile-table";
import SimpleCapabilityDialog from "@/components/SimpleCapabilityDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Capability } from "@/types";
import { toast } from "@/hooks/use-toast";

const CapabilityManagement = () => {
  console.log('🔄 CapabilityManagement: Component rendering');
  
  const { data, deleteCapability } = useData();
  const [selectedCapability, setSelectedCapability] = useState<Capability | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [capabilityToDelete, setCapabilityToDelete] = useState<Capability | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  console.log('🔄 CapabilityManagement: Current data:', { 
    capabilitiesCount: data.capabilities.length,
    milestonesCount: data.milestones.length 
  });

  const filteredCapabilities = useMemo(() => {
    return data.capabilities.filter(capability =>
      capability.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      capability.workstreamLead.toLowerCase().includes(searchTerm.toLowerCase()) ||
      capability.sme.toLowerCase().includes(searchTerm.toLowerCase()) ||
      capability.ba.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data.capabilities, searchTerm]);

  const handleAddCapability = () => {
    console.log('🔄 CapabilityManagement: Opening add capability dialog');
    setSelectedCapability(null);
    setIsDialogOpen(true);
  };

  const handleEditCapability = (capability: Capability) => {
    console.log('🔄 CapabilityManagement: Opening edit capability dialog for:', capability.name);
    setSelectedCapability(capability);
    setIsDialogOpen(true);
  };

  const handleDeleteCapability = (capability: Capability) => {
    console.log('🔄 CapabilityManagement: Opening delete confirmation for:', capability.name);
    setCapabilityToDelete(capability);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!capabilityToDelete) return;
    
    console.log('🔄 CapabilityManagement: Confirming delete for:', capabilityToDelete.name);
    
    try {
      await deleteCapability(capabilityToDelete.id);
      toast({
        title: "Success",
        description: "Capability deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setCapabilityToDelete(null);
    } catch (error) {
      console.error('❌ CapabilityManagement: Error deleting capability:', error);
      toast({
        title: "Error",
        description: "Failed to delete capability",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeColor = (status: Capability['status']) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'On Hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRagStatusColor = (ragStatus: Capability['ragStatus']) => {
    switch (ragStatus) {
      case 'Red':
        return 'bg-red-100 text-red-800';
      case 'Amber':
        return 'bg-yellow-100 text-yellow-800';
      case 'Green':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Capability Name',
      priority: 'high' as const,
      width: '200px',
    },
    {
      key: 'workstreamLead',
      label: 'Workstream Lead',
      priority: 'medium' as const,
      width: '150px',
    },
    {
      key: 'sme',
      label: 'SME',
      priority: 'medium' as const,
      width: '150px',
    },
    {
      key: 'ba',
      label: 'BA',
      priority: 'low' as const,
      width: '150px',
    },
    {
      key: 'milestone',
      label: 'Milestone',
      priority: 'medium' as const,
      width: '120px',
    },
    {
      key: 'status',
      label: 'Status',
      priority: 'high' as const,
      width: '120px',
    },
    {
      key: 'ragStatus',
      label: 'RAG',
      priority: 'high' as const,
      width: '80px',
    },
  ];

  const tableData = filteredCapabilities.map(capability => ({
    ...capability,
    status: (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(capability.status)}`}>
        {capability.status}
      </span>
    ),
    ragStatus: (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRagStatusColor(capability.ragStatus)}`}>
        {capability.ragStatus}
      </span>
    ),
    milestone: capability.milestone || 'No milestone',
  }));

  const getActions = (capability: any) => [
    {
      label: 'Edit',
      icon: Edit,
      onClick: () => handleEditCapability(capability),
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: () => handleDeleteCapability(capability),
      variant: 'destructive' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Capability Management</h1>
          <p className="text-gray-600 mt-2">Manage your organization's capabilities</p>
        </div>
        <Button onClick={handleAddCapability} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Capability
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search capabilities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <MobileTable
          columns={columns}
          data={tableData}
          actions={getActions}
          keyField="id"
        />
      </div>

      <SimpleCapabilityDialog
        capability={selectedCapability}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the capability
              "{capabilityToDelete?.name}" and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CapabilityManagement;
