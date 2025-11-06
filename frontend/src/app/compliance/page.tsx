"use client";

import { useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useAfyaStore } from "@/store/useAfyaStore";
import ComplianceLegend from "@/components/ComplianceLegend";
import ClauseCard from "@/components/ClauseCard";

export default function CompliancePage() {
  const { complianceRecords, setComplianceRecords } = useAfyaStore();

  // ✅ Always fetch fresh, backend already returns sorted data
  useEffect(() => {
    apiFetch("/compliance/")
      .then((data) => setComplianceRecords(data))
      .catch((err) => {
        console.error("Failed to fetch compliance:", err);
        // Show error to user using toast
      });
  }, [setComplianceRecords]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">ISO 7101 Compliance Clauses</h1>
        <ComplianceLegend className="mt-2" />
      </div>

      {complianceRecords.length === 0 ? (
        <p className="text-gray-500 italic">Loading compliance data...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {complianceRecords.map((clause) => (
            <ClauseCard key={clause.id} clause={clause} />
          ))}
        </div>
      )}
    </div>
  );
}
