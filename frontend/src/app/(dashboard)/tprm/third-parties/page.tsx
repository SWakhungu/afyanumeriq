"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Network, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";

type ThirdParty = {
  id: string;
  name: string;
  category: string;
  description?: string;
  criticality: "low" | "medium" | "high" | "critical";
  scope_of_dependency: string;
  status: "active" | "suspended" | "terminated";
  next_review_due: string | null;
};

export default function ThirdPartiesPage() {
  const [rows, setRows] = useState<ThirdParty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [critFilter, setCritFilter] = useState<
    "all" | "critical" | "high" | "medium" | "low"
  >("all");

  const filtered = useMemo(() => {
    if (critFilter === "all") return rows;
    return rows.filter((r) => r.criticality === critFilter);
  }, [rows, critFilter]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Your apiFetch already:
        // - resolves tenant host correctly
        // - injects Bearer token (window.__AFYA_ACCESS_TOKEN) if present
        // - attempts cookie-based refresh bootstrap
        const data = await apiFetch("/tprm/third-parties/", { method: "GET" });

        if (cancelled) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load third parties.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-gray-900">Third Parties</h1>
          <p className="text-sm text-gray-600 mt-1 max-w-4xl">
            Register and manage third parties that introduce risk to your organization
            through external dependencies, including operational, security, financial,
            legal, and strategic risks.
          </p>
        </div>

        <Link
          href="/tprm/third-parties/new"
          className="shrink-0 inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          <Plus size={16} />
          Add Third Party
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <FilterPill
          label="All"
          active={critFilter === "all"}
          onClick={() => setCritFilter("all")}
        />
        <FilterPill
          label="Critical"
          active={critFilter === "critical"}
          onClick={() => setCritFilter("critical")}
        />
        <FilterPill
          label="High"
          active={critFilter === "high"}
          onClick={() => setCritFilter("high")}
        />
        <FilterPill
          label="Medium"
          active={critFilter === "medium"}
          onClick={() => setCritFilter("medium")}
        />
        <FilterPill
          label="Low"
          active={critFilter === "low"}
          onClick={() => setCritFilter("low")}
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Registered Third Parties
          </h2>
        </div>

        <div className="p-4 overflow-x-auto">
          {loading ? (
            <div className="py-6 text-gray-500 text-sm">Loading third parties…</div>
          ) : error ? (
            <div className="py-6 text-red-600 text-sm">{error}</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2">Criticality</th>
                  <th className="pb-2">Scope of Dependency</th>
                  <th className="pb-2">Linked Risks</th>
                  <th className="pb-2">Next Review</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-gray-400 italic">
                      No third parties have been registered yet.
                    </td>
                  </tr>
                ) : (
                  filtered.map((tp) => (
                    <tr
                      key={tp.id}
                      className="border-b last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="py-3 font-medium text-gray-900">
                        <Link
                          href={`/tprm/third-parties/${tp.id}`}
                          className="hover:underline"
                        >
                          {tp.name}
                        </Link>
                      </td>
                      <td className="py-3 text-gray-700">{tp.category}</td>
                      <td className="py-3">
                        <BadgeCriticality value={tp.criticality} />
                      </td>
                      <td className="py-3 text-gray-700">{tp.scope_of_dependency}</td>
                      <td className="py-3 text-gray-500">—</td>
                      <td className="py-3 text-gray-700">{tp.next_review_due ?? "—"}</td>
                      <td className="py-3">
                        <BadgeStatus value={tp.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Guidance */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        <p className="flex items-start gap-2 max-w-4xl">
          <Network size={18} className="text-teal-700 mt-0.5" />
          Third parties should be registered and assessed based on how their services
          affect your organization’s operations, regulatory obligations, data handling,
          resilience, and strategic objectives — not procurement value alone.
        </p>
      </div>
    </div>
  );
}

/* ---------------- Helper Components ---------------- */

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? "bg-purple-600 text-white border-purple-600"
          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}

function BadgeCriticality({
  value,
}: {
  value: "low" | "medium" | "high" | "critical";
}) {
  const cls =
    value === "critical"
      ? "bg-red-50 text-red-700 border-red-200"
      : value === "high"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : value === "medium"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${cls}`}
    >
      {value.charAt(0).toUpperCase() + value.slice(1)}
    </span>
  );
}

function BadgeStatus({ value }: { value: "active" | "suspended" | "terminated" }) {
  const cls =
    value === "active"
      ? "bg-green-50 text-green-700 border-green-200"
      : value === "suspended"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  const label = value.charAt(0).toUpperCase() + value.slice(1);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}
