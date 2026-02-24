"use client";

import { useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useAfyaStore } from "@/store/useAfyaStore";
import ComplianceLegend from "@/components/ComplianceLegend";
import ClauseCard from "@/components/ClauseCard";


const STANDARD = "iso-7101"; // 🔒 Explicit, non-negotiable

export default function CompliancePage() {
  const { complianceRecords, setComplianceRecords } = useAfyaStore();

  useEffect(() => {
    apiFetch(`/compliance/?standard=${STANDARD}`)
      .then((data) => {
        setComplianceRecords(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to fetch compliance:", err);
        setComplianceRecords([]); // defensive
      });
  }, [setComplianceRecords]);

  // Update one clause in store after ClauseCard PATCH/upload succeeds
  const upsertClause = (updated: any) => {
    if (!updated?.id) return;
    setComplianceRecords(
      complianceRecords.map((c: any) => (c.id === updated.id ? updated : c))
    );
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">ISO 7101 Compliance Clauses</h1>
        <ComplianceLegend className="mt-2" />
      </div>

      {complianceRecords.length === 0 ? (
        <p className="text-gray-500 italic">
          No compliance clauses found for this standard.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {complianceRecords.map((clause: any) => (
            <ClauseCard
              key={clause.id}
              clause={clause}
              standard="iso-7101"
              onChange={upsertClause}
            />
          ))}
        </div>
      )}
    </div>
  );
}
