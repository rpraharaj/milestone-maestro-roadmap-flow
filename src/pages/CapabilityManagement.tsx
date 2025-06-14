import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Target } from "lucide-react";
import CapabilityDialog from "@/components/CapabilityDialog";
import { Capability } from "@/types";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

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
      {/* Removed headline/description - now handled by Layout */}
      <div className="flex justify-end items-center">
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

      {/* Capabilities Table View */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Name</TableHead>
                  <TableHead className="min-w-[120px]">Workstream Lead</TableHead>
                  <TableHead className="min-w-[120px]">SME</TableHead>
                  <TableHead className="min-w-[120px]">BA</TableHead>
                  <TableHead className="min-w-[140px]">Milestone</TableHead>
                  <TableHead className="min-w-[110px]">Status</TableHead>
                  <TableHead className="min-w-[110px]">RAG</TableHead>
                  <TableHead className="min-w-[160px]">Notes</TableHead>
                  <TableHead className="min-w-[70px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCapabilities.map((capability) => (
                  <TableRow key={capability.id}>
                    <TableCell className="font-medium">{capability.name}</TableCell>
                    <TableCell>{capability.workstreamLead}</TableCell>
                    <TableCell>{capability.sme}</TableCell>
                    <TableCell>{capability.ba}</TableCell>
                    <TableCell>{capability.milestone || "-"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(capability.status)}>
                        {capability.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRagBadgeColor(capability.ragStatus)}>
                        {capability.ragStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {capability.notes
                        ? capability.notes.length > 100
                          ? `${capability.notes.substring(0, 100)}...`
                          : capability.notes
                        : "-"
                      }
                    </TableCell>
                    <TableCell className="flex gap-2 justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(capability)}
                        aria-label="Edit capability"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(capability.id)}
                        aria-label="Delete capability"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredCapabilities.length === 0 && (
            <div className="p-12 text-center">
              <div className="text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No capabilities found</h3>
                <p className="text-sm">
                  {data.capabilities.length === 0 
                    ? "Get started by adding your first capability"
                    : "Try adjusting your search or filter criteria"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CapabilityDialog
        capability={selectedCapability}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  );
};

export default CapabilityManagement;

// --- NOTE: This file is now quite long. You may want to consider refactoring it into smaller components for better maintainability.
