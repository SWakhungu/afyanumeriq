"use client";

import { useEffect, useState } from "react";
import ClauseCard from "@/components/ClauseCard";
import ComplianceLegend from "@/components/ComplianceLegend";
import { apiFetch } from "@/lib/api";

export default function ISO27001CompliancePage() {
  const [clauses, setClauses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClauses() {
      try {
        const data = await apiFetch("/compliance/?standard=iso-27001");
        setClauses(data);
      } catch (err) {
        console.error("Failed to load 27001 clauses", err);
      } finally {
        setLoading(false);
      }
    }
    loadClauses();
  }, []);

  if (loading)
    return <div className="p-10 text-center">Loading ISO 27001 clauses…</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          ISO/IEC 27001 — Compliance Clauses
        </h1>

        {/* Legend Component (collapsible, identical to ISO 7101) */}

        <ComplianceLegend className="mt-2" />
      </div>

      {/* Clause Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clauses.map((clause) => (
          <ClauseCard key={clause.id} clause={clause} standard="iso-27001" />
        ))}
      </div>
    </div>
  );
}
