
import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import CapabilityDialog from "@/components/CapabilityDialog";
import { Capability } from "@/types";

const CapabilityManagement = () => {
  const { data, deleteCapability } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCapability, setSelectedCapability] = useState<Capability | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ragFilter, setRagFilter] = useState<string>("all");

  const filteredCapabilities = data.capabilities.filter((capability) => {
    const matchesSearch = capability.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         capability.workstreamLead.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || capability.status === statusFilter;
    const matchesRag = ragFilter === "all" || capability.ragStatus === ragFilter;
    
    return matchesSearch && matchesStatus && matchesRag;
  });

  const handleEdit = (capability: Capability) => {
    setSelectedCapability(capability);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this capability?")) {
      deleteCapability(id);
    }
  };

  const handleAddNew = () => {
    setSelectedCapability(null);
    setIsDialogOpen(true);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRagBadgeColor = (rag: string) => {
    switch (rag) {
      case 'Red': return 'bg-red-100 text-red-800';
      case 'Amber': return 'bg-amber-100 text-amber-800';
      case 'Green': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Capability Management</h1>
          <p className="text-gray-600 mt-2">Manage project capabilities and their details</p>
        </div>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Capability
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search capabilities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="all">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
            <select
              value={ragFilter}
              onChange={(e) => setRagFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="all">All RAG Status</option>
              <option value="Red">Red</option>
              <option value="Amber">Amber</option>
              <option value="Green">Green</option>
            </select>
            <div className="text-sm text-gray-600 flex items-center">
              Showing {filteredCapabilities.length} of {data.capabilities.length} capabilities
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capabilities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCapabilities.map((capability) => (
          <Card key={capability.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{capability.name}</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(capability)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(capability.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <Badge className={getStatusBadgeColor(capability.status)}>
                  {capability.status}
                </Badge>
                <Badge className={getRagBadgeColor(capability.ragStatus)}>
                  {capability.ragStatus}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Lead:</span> {capability.workstreamLead}
                </div>
                <div>
                  <span className="font-medium">SME:</span> {capability.sme}
                </div>
                <div>
                  <span className="font-medium">BA:</span> {capability.ba}
                </div>
                {capability.milestone && (
                  <div>
                    <span className="font-medium">Milestone:</span> {capability.milestone}
                  </div>
                )}
              </div>
              
              {capability.notes && (
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {capability.notes.length > 100 
                    ? `${capability.notes.substring(0, 100)}...` 
                    : capability.notes}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCapabilities.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-500">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No capabilities found</h3>
              <p className="text-sm">
                {data.capabilities.length === 0 
                  ? "Get started by adding your first capability"
                  : "Try adjusting your search or filter criteria"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <CapabilityDialog
        capability={selectedCapability}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  );
};

export default CapabilityManagement;
