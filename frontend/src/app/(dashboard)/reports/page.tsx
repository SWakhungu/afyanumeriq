"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiBase } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

export default function ReportsPage() {
  const { show } = useToast();

  function downloadFile(url: string, filename: string) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleDownload(path: string, filename: string) {
    const fullUrl = `${apiBase}${path}`;
    downloadFile(fullUrl, filename);
    show(`Downloading ${filename}…`, "info");
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">ISO 7101 — Reports & Exports</h1>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Data Exports</h2>

        <div className="flex flex-col md:flex-row gap-4">
          <Button
            onClick={() =>
              handleDownload(
                `/reports/compliance.csv`,
                "iso-7101-compliance.csv"
              )
            }
          >
            Compliance CSV
          </Button>

          <Button
            onClick={() =>
              handleDownload(`/reports/risks.csv`, "iso-7101-risks.csv")
            }
          >
            Risk Register CSV
          </Button>

          <Button
            onClick={() =>
              handleDownload(`/reports/audits.csv`, "iso-7101-audits.csv")
            }
          >
            Audit Summary CSV
          </Button>
        </div>
      </Card>
    </div>
  );
}
