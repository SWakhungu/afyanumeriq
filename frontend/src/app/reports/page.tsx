"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiBase } from "@/lib/api"; // ✅ ensures same base as rest of app
import { useToast } from "@/components/ui/use-toast";

export default function ReportsPage() {
  const { show } = useToast();

  // Shared download helper
  function downloadFile(url: string, filename: string) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleDownload = (path: string, filename: string) => {
    const fullUrl = `${apiBase}${path}`;
    downloadFile(fullUrl, filename);
    show(`Downloading ${filename}...`, "info");
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Reports & Exports</h1>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Data Exports</h2>

        <div className="flex flex-col md:flex-row gap-4">
          <Button
            onClick={() =>
              handleDownload("/reports/compliance.csv", "compliance.csv")
            }
          >
            Download Compliance CSV
          </Button>

          <Button
            onClick={() =>
              handleDownload("/reports/compliance.pdf", "compliance.pdf")
            }
          >
            Download Compliance PDF
          </Button>

          <Button
            onClick={() => handleDownload("/reports/risks.csv", "risks.csv")}
          >
            Download Risk Register CSV
          </Button>
        </div>
      </Card>
    </div>
  );
}
