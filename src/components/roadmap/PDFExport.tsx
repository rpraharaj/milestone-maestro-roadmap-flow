
import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface PDFExportProps {
  onExportPDF: () => void;
}

export default function PDFExport({ onExportPDF }: PDFExportProps) {
  return (
    <Button
      onClick={onExportPDF}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      Export PDF
    </Button>
  );
}
