"use client";

import { useEffect, useState } from "react";
import ClauseCard from "@/components/ClauseCard";
import ComplianceLegend from "@/components/ComplianceLegend";
import { apiFetch } from "@/lib/api";

export default function ISO27001CompliancePage() {
  const [clauses, setClauses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadClauses = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/27001/clauses/");
      setClauses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load 27001 clauses", err);
      setClauses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClauses();
  }, []);

  const upsertClause = (updated: any) => {
    setClauses((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
    );
  };

  if (loading) {
    return <div className="p-10 text-center">Loading ISO 27001 clauses…</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          ISO/IEC 27001 — Compliance Clauses
        </h1>
        <ComplianceLegend className="mt-2" />
      </div>

      {clauses.length === 0 ? (
        <p className="text-gray-500 italic">
          No ISO 27001 compliance clauses found.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clauses.map((clause) => (
            <ClauseCard
              key={clause.id}
              clause={clause}
              standard="iso-27001"
              onChange={upsertClause}
            />
          ))}
        </div>
      )}
    </div>
  );
}
