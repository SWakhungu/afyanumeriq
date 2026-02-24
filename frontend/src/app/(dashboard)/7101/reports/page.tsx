"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiFetchBlob } from "@/lib/api";

export default function ReportsPage() {
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
      <h1 className="text-2xl font-semibold">ISO 7101 — Reports & Exports</h1>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Data Exports</h2>

        <div className="flex flex-col md:flex-row gap-4">
          <Button
            onClick={() =>
              handleDownload("/reports/compliance.csv", "iso-7101-compliance.csv")
            }
          >
            Compliance CSV
          </Button>

          <Button
            onClick={() => handleDownload("/reports/risks.csv", "iso-7101-risks.csv")}
          >
            Risk Register CSV
          </Button>

          <Button
            onClick={() => handleDownload("/reports/audits.csv", "iso-7101-audits.csv")}
          >
            Audit Summary CSV
          </Button>
        </div>
      </Card>
    </div>
  );
}
