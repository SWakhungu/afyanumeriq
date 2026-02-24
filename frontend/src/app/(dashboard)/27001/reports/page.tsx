"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiFetchBlob } from "@/lib/api";

export default function ISO27001Reports() {
  const { show } = useToast();

  async function handleDownload(path: string, fallbackFilename: string) {
    try {
      show(`Preparing ${fallbackFilename}…`, "info");

      const { blob, filename } = await apiFetchBlob(path);
      const finalName = filename || fallbackFilename;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = finalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      show(`Downloaded ${finalName} ✅`, "success");
    } catch (err: any) {
      show(`Download failed: ${err.message}`, "error");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">ISO/IEC 27001 — Reports & Exports</h1>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Data Exports</h2>

        <div className="flex flex-col md:flex-row gap-4">
          <Button
            onClick={() =>
              handleDownload("/27001/reports/compliance.csv", "iso27001-compliance.csv")
            }
          >
            Download Compliance CSV
          </Button>

          <Button onClick={() => handleDownload("/27001/reports/soa.csv", "iso27001-soa.csv")}>
            Download Statement of Applicability (CSV)
          </Button>

          <Button
            onClick={() =>
              handleDownload("/27001/reports/risks.csv", "iso27001-risk-register.csv")
            }
          >
            Download Risk Register CSV
          </Button>

          <Button
            onClick={() =>
              handleDownload("/27001/reports/assets.csv", "iso27001-asset-register.csv")
            }
          >
            Download Asset Register CSV
          </Button>

          <Button onClick={() => handleDownload("/27001/reports/audits.csv", "iso27001-audits.csv")}>
            Download Audit Summary CSV
          </Button>
        </div>
      </Card>
    </div>
  );
}
