"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, Network, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";

type ThirdParty = {
  id: string;
  name: string;
  criticality: "low" | "medium" | "high" | "critical";
  status: "active" | "suspended" | "terminated";
  next_review_due: string | null; // YYYY-MM-DD
};

function isOverdue(dateStr: string | null) {
  if (!dateStr) return false;
  const due = new Date(dateStr + "T00:00:00");
  const now = new Date();
  // compare by date only
  return due.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

export default function TPRMOverviewPage() {
  const [rows, setRows] = useState<ThirdParty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch("/tprm/third-parties/", { method: "GET" });
        if (cancelled) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load TPRM overview.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const kpis = useMemo(() => {
    const total = rows.length;
    const critical = rows.filter((r) => r.criticality === "critical").length;
    const high = rows.filter((r) => r.criticality === "high").length;
    const overdue = rows.filter((r) => r.status === "active" && isOverdue(r.next_review_due)).length;
    return { total, critical, high, overdue };
  }, [rows]);

  const overdueItems = useMemo(() => {
    return rows
      .filter((r) => r.status === "active" && isOverdue(r.next_review_due))
      .slice(0, 6);
  }, [rows]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-gray-900">TPRM</h1>
          <p className="text-sm text-gray-600 mt-1 max-w-4xl">
            Third-Party Risk Management helps you register external dependencies, assess
            risks across domains (operational, security, financial, legal, and strategic),
            and maintain oversight through periodic reviews and assurance.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <Link
            href="/tprm/third-parties/new"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            <Plus size={16} />
            Add Third Party
          </Link>

          <Link
            href="/tprm/third-parties"
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-md border border-gray-300"
          >
            <Network size={16} />
            View Registry
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="Total Third Parties" value={kpis.total} icon={<Network size={18} className="text-teal-700" />} />
        <KpiCard title="Critical Third Parties" value={kpis.critical} icon={<AlertTriangle size={18} className="text-red-700" />} />
        <KpiCard title="High Criticality" value={kpis.high} icon={<AlertTriangle size={18} className="text-amber-700" />} />
        <KpiCard title="Overdue Reviews" value={kpis.overdue} icon={<CalendarClock size={18} className="text-purple-700" />} />
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Overdue Reviews</h2>
              <Link href="/tprm/third-parties" className="text-sm text-teal-700 hover:underline">
                View all
              </Link>
            </div>

            <div className="p-4">
              {loading ? (
                <div className="py-4 text-sm text-gray-500">Loading…</div>
              ) : error ? (
                <div className="py-4 text-sm text-red-600">{error}</div>
              ) : overdueItems.length === 0 ? (
                <div className="py-4 text-sm text-gray-500">
                  No overdue reviews right now.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {overdueItems.map((tp) => (
                    <li key={tp.id} className="py-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <Link
                          href={`/tprm/third-parties/${tp.id}`}
                          className="font-medium text-gray-900 hover:underline"
                        >
                          {tp.name}
                        </Link>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Next review due: {tp.next_review_due ?? "—"}
                        </div>
                      </div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md border bg-amber-50 text-amber-800 border-amber-200">
                        Overdue
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Quick Guidance</h2>
            </div>
            <div className="p-4 text-sm text-gray-600 space-y-3">
              <p>
                Keep TPRM separate from standard-specific risk workflows. TPRM focuses on
                risks introduced by external dependencies.
              </p>
              <p>
                Prioritize review frequency based on criticality and the impact of the
                service on operations, compliance obligations, and resilience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function KpiCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4 shadow-sm">
      <div className="p-2 bg-gray-50 rounded-md">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
