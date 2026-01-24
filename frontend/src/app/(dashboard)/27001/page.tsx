"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function ISO27001Dashboard() {
  const [metrics, setMetrics] = useState<null | {
    open_risks: number;
    critical_assets_secure_percent: number;
    applicable_annex_controls: number;
    soa_completeness_pct: number;
  }>(null);

  useEffect(() => {
    apiFetch("/27001/dashboard/overview/")
      .then(setMetrics)
      .catch((e) =>
        console.error("Failed to load ISO 27001 dashboard metrics", e)
      );
  }, []);

  if (!metrics) {
    return <p className="text-gray-500">Loading dashboard…</p>;
  }

  const {
    open_risks,
    critical_assets_secure_percent,
    applicable_annex_controls,
    soa_completeness_pct,
  } = metrics;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">
          ISMS Dashboard Overview
        </h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Untreated Risks (label unchanged for now) */}
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <p className="text-sm text-gray-500">Untreated Risks</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {open_risks}
          </p>
        </div>

        {/* Critical Assets Secure */}
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <p className="text-sm text-gray-500">
            Critical Assets Secured
          </p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">
            {critical_assets_secure_percent}%
          </p>
        </div>

        {/* Applicable Controls */}
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <p className="text-sm text-gray-500">
            Applicable Annex A Controls
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {applicable_annex_controls}
          </p>
        </div>

        {/* SoA Completeness */}
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <p className="text-sm text-gray-500">
            SoA Completeness
          </p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {soa_completeness_pct}%
          </p>
        </div>
      </div>

      {/* Center Compliance Donut (unchanged) */}
      <div className="flex justify-center pt-10">
        <div className="bg-white border rounded-xl shadow-sm p-8 w-[260px] h-[260px] flex flex-col items-center justify-center">
          <div className="relative w-40 h-40 rounded-full border-[14px] border-gray-200 flex items-center justify-center">
            <div
              className="absolute top-0 left-0 w-full h-full rounded-full border-[14px] border-orange-500"
              style={{
                clipPath: `polygon(50% 50%, 0% 0%, 100% 0%)`,
              }}
            />
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">
                {soa_completeness_pct}%
              </p>
              <p className="text-sm text-gray-500">SoA Complete</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 text-gray-500 text-sm italic">
        Live ISO/IEC 27001 metrics powered by AfyaNumeriq Compliance & Risk Modules
      </div>
    </div>
  );
}
