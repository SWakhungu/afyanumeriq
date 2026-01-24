"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiBase } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

export default function ISO27001Reports() {
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
      <h1 className="text-2xl font-semibold">
        ISO/IEC 27001 — Reports & Exports
      </h1>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Data Exports</h2>

        <div className="flex flex-col md:flex-row gap-4">
          <Button
            onClick={() =>
              handleDownload(
                `/27001/reports/compliance.csv`,
                "iso27001-compliance.csv"
              )
            }
          >
            Download Compliance CSV
          </Button>

          <Button
            onClick={() =>
              handleDownload(`/27001/reports/soa.csv`, "iso27001-soa.csv")
            }
          >
            Download Statement of Applicability (CSV)
          </Button>

          <Button
            onClick={() =>
              handleDownload(
                `/27001/reports/risks.csv`,
                "iso27001-risk-register.csv"
              )
            }
          >
            Download Risk Register CSV
          </Button>

          <Button
            onClick={() =>
              handleDownload(
                `/27001/reports/assets.csv`,
                "iso27001-asset-register.csv"
              )
            }
          >
            Download Asset Register CSV
          </Button>

          <Button
            onClick={() =>
              handleDownload(`/27001/reports/audits.csv`, "iso27001-audits.csv")
            }
          >
            Download Audit Summary CSV
          </Button>
        </div>
      </Card>
    </div>
  );
}
