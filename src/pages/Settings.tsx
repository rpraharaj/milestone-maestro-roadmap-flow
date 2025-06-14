import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Download, Upload, FileText, Database, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AppData } from "@/types";

export default function Settings() {
  const { exportData, importData, data } = useData();
  const [importText, setImportText] = useState("");
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleExportJSON = () => {
    try {
      const dataToExport = exportData();
      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `project-manager-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Data exported successfully as JSON",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = () => {
    try {
      // Export capabilities
      const capabilitiesCSV = [
        ['Name', 'Workstream Lead', 'SME', 'BA', 'Milestone', 'Status', 'RAG Status', 'Notes', 'Created At'].join(','),
        ...data.capabilities.map(cap => [
          `"${cap.name}"`,
          `"${cap.workstreamLead}"`,
          `"${cap.sme}"`,
          `"${cap.ba}"`,
          `"${cap.milestone}"`,
          `"${cap.status}"`,
          `"${cap.ragStatus}"`,
          `"${cap.notes.replace(/"/g, '""')}"`,
          `"${cap.createdAt.toISOString()}"`,
        ].join(','))
      ].join('\n');

      // Export milestones
      const milestonesCSV = [
        ['Name', 'Date', 'Created At'].join(','),
        ...data.milestones.map(mil => [
          `"${mil.name}"`,
          `"${mil.date.toISOString().split('T')[0]}"`,
          `"${mil.createdAt.toISOString()}"`,
        ].join(','))
      ].join('\n');

      // Create combined CSV content
      const csvContent = `CAPABILITIES\n${capabilitiesCSV}\n\nMILESTONES\n${milestonesCSV}`;
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `project-manager-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Data exported successfully as CSV",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export CSV data",
        variant: "destructive",
      });
    }
  };

  const handleImportJSON = () => {
    try {
      if (!importText.trim()) {
        toast({
          title: "Error",
          description: "Please paste JSON data to import",
          variant: "destructive",
        });
        return;
      }

      const parsedData = JSON.parse(importText);
      
      // Validate structure
      if (!parsedData.capabilities || !parsedData.milestones || !parsedData.roadmapPlans) {
        throw new Error("Invalid data structure");
      }

      // Convert date strings back to Date objects
      const processedData: AppData = {
        capabilities: parsedData.capabilities.map((cap: any) => ({
          ...cap,
          createdAt: new Date(cap.createdAt),
          updatedAt: new Date(cap.updatedAt),
        })),
        milestones: parsedData.milestones.map((mil: any) => ({
          ...mil,
          date: new Date(mil.date),
          createdAt: new Date(mil.createdAt),
          updatedAt: new Date(mil.updatedAt),
        })),
        roadmapPlans: parsedData.roadmapPlans.map((plan: any) => ({
          ...plan,
          requirementStartDate: new Date(plan.requirementStartDate),
          requirementEndDate: new Date(plan.requirementEndDate),
          designStartDate: new Date(plan.designStartDate),
          designEndDate: new Date(plan.designEndDate),
          devStartDate: new Date(plan.devStartDate),
          devEndDate: new Date(plan.devEndDate),
          cstStartDate: new Date(plan.cstStartDate),
          cstEndDate: new Date(plan.cstEndDate),
          uatStartDate: new Date(plan.uatStartDate),
          uatEndDate: new Date(plan.uatEndDate),
          createdAt: new Date(plan.createdAt),
        })),
      };

      importData(processedData);
      setImportText("");
      
      toast({
        title: "Success",
        description: "Data imported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import data. Please check the JSON format.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportText(content);
      };
      reader.readAsText(file);
    } else {
      toast({
        title: "Error",
        description: "Please select a JSON file",
        variant: "destructive",
      });
    }
  };

  const handleResetData = () => {
    if (showConfirmReset) {
      importData({ capabilities: [], milestones: [], roadmapPlans: [] });
      setShowConfirmReset(false);
      toast({
        title: "Success",
        description: "All data has been reset",
      });
    } else {
      setShowConfirmReset(true);
      setTimeout(() => setShowConfirmReset(false), 5000); // Auto-hide after 5 seconds
    }
  };

  const stats = {
    capabilities: data.capabilities.length,
    milestones: data.milestones.length,
    roadmapPlans: data.roadmapPlans.length,
    totalSize: JSON.stringify(data).length,
  };

  return (
    <div className="space-y-6">
      {/* Data Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Data Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.capabilities}</div>
              <div className="text-sm text-gray-600">Capabilities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.milestones}</div>
              <div className="text-sm text-gray-600">Milestones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.roadmapPlans}</div>
              <div className="text-sm text-gray-600">Roadmap Plans</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{(stats.totalSize / 1024).toFixed(1)}KB</div>
              <div className="text-sm text-gray-600">Data Size</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Export your project data for backup or sharing purposes.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button onClick={handleExportJSON}>
              <FileText className="h-4 w-4 mr-2" />
              Export as JSON
            </Button>
            <Button onClick={handleExportCSV} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Export as CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Import Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Import project data from a JSON file. This will replace all existing data.
          </p>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Upload JSON File</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="import-text">Or Paste JSON Data</Label>
              <Textarea
                id="import-text"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste your JSON data here..."
                rows={8}
                className="mt-1 font-mono text-sm"
              />
            </div>
            
            <Button 
              onClick={handleImportJSON} 
              disabled={!importText.trim()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reset Data */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center text-red-700">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Permanently delete all project data. This action cannot be undone.
          </p>
          <Button 
            onClick={handleResetData}
            variant={showConfirmReset ? "destructive" : "outline"}
            className={showConfirmReset ? "" : "border-red-200 text-red-700 hover:bg-red-50"}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            {showConfirmReset ? "Confirm Reset - This Will Delete Everything!" : "Reset All Data"}
          </Button>
          {showConfirmReset && (
            <p className="text-sm text-red-600">
              Click the button again within 5 seconds to confirm the reset.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
