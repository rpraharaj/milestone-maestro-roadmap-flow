
import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Target, Download, Upload } from "lucide-react";
import CapabilityDialog from "@/components/CapabilityDialog";
import { Capability } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

const CapabilityManagement = () => {
  const { data, deleteCapability, addCapability } = useData();
  const { toast } = useToast();
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

  const exportToCSV = () => {
    const headers = ['Name', 'Workstream Lead', 'SME', 'BA', 'Milestone', 'Status', 'RAG Status', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...data.capabilities.map(cap => [
        `"${cap.name.replace(/"/g, '""')}"`,
        `"${cap.workstreamLead.replace(/"/g, '""')}"`,
        `"${cap.sme.replace(/"/g, '""')}"`,
        `"${cap.ba.replace(/"/g, '""')}"`,
        `"${cap.milestone?.replace(/"/g, '""') || ''}"`,
        `"${cap.status}"`,
        `"${cap.ragStatus}"`,
        `"${cap.notes?.replace(/"/g, '""') || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `capabilities_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: "Capabilities data has been exported to CSV.",
    });
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
      i++;
    }
    
    result.push(current.trim());
    return result;
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error('CSV file must contain at least a header row and one data row.');
        }

        const headers = parseCSVLine(lines[0]);
        
        // Validate headers - check if all required headers are present (case insensitive and trimmed)
        const expectedHeaders = ['Name', 'Workstream Lead', 'SME', 'BA', 'Milestone', 'Status', 'RAG Status', 'Notes'];
        const normalizedHeaders = headers.map(h => h.trim());
        const normalizedExpected = expectedHeaders.map(h => h.toLowerCase());
        const normalizedActual = normalizedHeaders.map(h => h.toLowerCase());
        
        const missingHeaders = normalizedExpected.filter(header => 
          !normalizedActual.includes(header)
        );
        
        if (missingHeaders.length > 0) {
          throw new Error(`Missing required headers: ${missingHeaders.join(', ')}. Expected headers: ${expectedHeaders.join(', ')}`);
        }

        // Create a mapping of header positions
        const headerMap: { [key: string]: number } = {};
        normalizedHeaders.forEach((header, index) => {
          const normalizedHeader = header.toLowerCase();
          if (normalizedExpected.includes(normalizedHeader)) {
            headerMap[normalizedHeader] = index;
          }
        });

        let importCount = 0;
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          try {
            const values = parseCSVLine(line);
            
            if (values.length < expectedHeaders.length) {
              errors.push(`Row ${i + 1}: Not enough columns (expected ${expectedHeaders.length}, got ${values.length})`);
              continue;
            }

            const capability = {
              name: values[headerMap['name']] || '',
              workstreamLead: values[headerMap['workstream lead']] || '',
              sme: values[headerMap['sme']] || '',
              ba: values[headerMap['ba']] || '',
              milestone: values[headerMap['milestone']] || '',
              status: values[headerMap['status']] as Capability['status'],
              ragStatus: values[headerMap['rag status']] as Capability['ragStatus'],
              notes: values[headerMap['notes']] || '',
            };

            // Validate required fields
            if (!capability.name.trim()) {
              errors.push(`Row ${i + 1}: Name is required`);
              continue;
            }
            if (!capability.workstreamLead.trim()) {
              errors.push(`Row ${i + 1}: Workstream Lead is required`);
              continue;
            }
            if (!capability.sme.trim()) {
              errors.push(`Row ${i + 1}: SME is required`);
              continue;
            }
            if (!capability.ba.trim()) {
              errors.push(`Row ${i + 1}: BA is required`);
              continue;
            }

            // Validate enum values
            if (!['Not Started', 'In Progress', 'Completed', 'On Hold'].includes(capability.status)) {
              errors.push(`Row ${i + 1}: Invalid status "${capability.status}". Must be one of: Not Started, In Progress, Completed, On Hold`);
              continue;
            }

            if (!['Red', 'Amber', 'Green'].includes(capability.ragStatus)) {
              errors.push(`Row ${i + 1}: Invalid RAG status "${capability.ragStatus}". Must be one of: Red, Amber, Green`);
              continue;
            }

            addCapability(capability);
            importCount++;
          } catch (rowError) {
            errors.push(`Row ${i + 1}: ${rowError instanceof Error ? rowError.message : 'Unknown error'}`);
          }
        }

        if (errors.length > 0) {
          console.warn('Import errors:', errors);
        }

        toast({
          title: "Import completed",
          description: `${importCount} capabilities imported successfully.${errors.length > 0 ? ` ${errors.length} rows had errors.` : ''}`,
          variant: errors.length > 0 && importCount === 0 ? "destructive" : "default",
        });
      } catch (error) {
        console.error('Import error:', error);
        toast({
          title: "Import failed",
          description: error instanceof Error ? error.message : "Failed to import CSV file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Clear the input value to allow re-importing the same file
    event.target.value = '';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-gray-100 text-gray-800';
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
      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" className="bg-green-50 hover:bg-green-100 border-green-200">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="csv-import"
            />
            <Button variant="outline" className="bg-gray-50 hover:bg-gray-100 border-gray-200">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
          </div>
        </div>
        <Button onClick={handleAddNew}>
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
