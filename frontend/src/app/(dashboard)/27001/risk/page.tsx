"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import RiskTable from "./RiskTable";
import { useRouter, useSearchParams } from "next/navigation";

function WorkflowHeader({ activeStep }: { activeStep: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Assets" },
    { n: 2, label: "Risks" },
    { n: 3, label: "SoA" },
  ] as const;

  return (
    <div className="bg-white border rounded-lg p-4 flex items-center justify-between">
      <div>
        <div className="text-sm font-semibold text-gray-800">
          ISO/IEC 27001 Workflow
        </div>
        <div className="text-xs text-gray-500">
          Assets → Risks → Statement of Applicability (SoA)
        </div>
      </div>

      <div className="flex items-center gap-2">
        {steps.map((s, idx) => (
          <span key={s.n} className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                activeStep === s.n
                  ? "bg-blue-600 text-white border-blue-600"
                  : activeStep > s.n
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-gray-50 text-gray-600 border-gray-200"
              }`}
            >
              {s.n}. {s.label}
            </span>
            {idx < steps.length - 1 && (
              <span className="text-gray-300 text-sm">→</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ISO27001RiskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assetIdParam = searchParams.get("asset_id");
  const assetIdFromUrl = assetIdParam ? Number(assetIdParam) : null;

  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<any[]>([]);

  // ✅ Default = All Assets (null) unless URL has asset_id
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(
    assetIdFromUrl ?? null
  );

  // Keep selection synced to URL on initial mount
  useEffect(() => {
    setSelectedAssetId(assetIdFromUrl ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    apiFetch("/isms/risks/?standard=iso-27001")
      .then(setRisks)
      .catch((e) => console.error("Failed to load ISO 27001 risks", e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    apiFetch("/isms/assets/?standard=iso-27001")
      .then((data) => {
        setAssets(data || []);
        // ❌ IMPORTANT: do NOT auto-select first asset.
        // We want global view by default.
      })
      .catch((e) => console.error("Failed to load assets", e));
  }, []);

  const selectedAsset = useMemo(() => {
    if (!selectedAssetId) return null;
    return assets.find((a: any) => a.id === selectedAssetId) || null;
  }, [assets, selectedAssetId]);

  // Best-effort client-side filter (depends on backend shape)
  const filteredRisks = useMemo(() => {
    // ✅ Global listing when All Assets (selectedAssetId is null)
    if (!selectedAssetId) return risks;

    return (risks || []).filter((r: any) => {
      // common shapes: r.asset (id), r.asset_id, r.asset (object)
      if (typeof r.asset === "number") return r.asset === selectedAssetId;
      if (typeof r.asset_id === "number") return r.asset_id === selectedAssetId;
      if (r.asset && typeof r.asset.id === "number") return r.asset.id === selectedAssetId;

      // If backend shape is unknown, don't hide (avoid "empty table" bugs)
      return true;
    });
  }, [risks, selectedAssetId]);

  const syncUrlToAsset = (id: number | null) => {
    // ✅ All Assets -> go to /27001/risk (no query)
    if (!id) {
      router.push(`/27001/risk`);
      return;
    }
    router.push(`/27001/risk?asset_id=${id}`);
  };

  const continueToSoA = () => {
    // ✅ All Assets -> global SoA
    if (!selectedAssetId) {
      router.push(`/27001/soa`);
      return;
    }
    router.push(`/27001/soa?asset_id=${selectedAssetId}`);
  };

  return (
    <div className="p-6 space-y-6">
      <WorkflowHeader activeStep={2} />

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            ISO/IEC 27001 — Risk Management
          </h1>
          <p className="text-sm text-gray-500">
            Risks linked to assets and Annex A controls
          </p>
        </div>

        {/* Asset selector + Continue */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="min-w-[280px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset (risks are recorded per asset)
            </label>

            <select
              value={selectedAssetId ?? 0} // 0 represents "All Assets"
              onChange={(e) => {
                const raw = Number(e.target.value);
                const id = raw === 0 ? null : raw;
                setSelectedAssetId(id);
                syncUrlToAsset(id);
              }}
              className="w-full border rounded px-3 py-2"
            >
              <option value={0}>All Assets</option>

              {assets.length === 0 ? (
                <option value={0} disabled>
                  No assets yet
                </option>
              ) : (
                assets.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.asset_id})
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            onClick={continueToSoA}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Continue to SoA →
          </button>
        </div>
      </div>

      {/* Context note */}
      <div className="bg-white border rounded-lg p-4 text-sm text-gray-700">
        <div className="font-semibold text-gray-900">Current asset</div>
        <div className="text-gray-600">
          {selectedAssetId ? (
            selectedAsset ? (
              <>
                {selectedAsset.name}{" "}
                <span className="text-gray-400">({selectedAsset.asset_id})</span>
              </>
            ) : (
              <>Asset ID: {selectedAssetId}</>
            )
          ) : (
            <>All Assets</>
          )}
        </div>
      </div>

      {/* 🔎 Treatment & Coverage Legend */}
      <div className="bg-gray-50 border rounded p-3 text-xs text-gray-700">
        <div className="font-semibold mb-1">
          Risk Treatment & Coverage Meaning
        </div>
        <ul className="list-disc ml-5 space-y-0.5">
          <li>
            <b>Reduce + Untreated</b> → Risk identified, controls not implemented
          </li>
          <li>
            <b>Reduce + Partial</b> → Risk under treatment
          </li>
          <li>
            <b>Reduce + Adequate</b> → Risk reduced to acceptable level
          </li>
          <li>
            <b>Accept</b> → Risk formally accepted
          </li>
          <li>
            <b>Transfer</b> → Risk contractually transferred
          </li>
          <li>
            <b>Avoid</b> → Risk source eliminated
          </li>
        </ul>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading risks…</p>
      ) : assets.length === 0 ? (
        <div className="bg-white border rounded-lg p-6 text-gray-700">
          <div className="font-semibold mb-1">No assets yet</div>
          <div className="text-sm text-gray-600">
            Go back to the Asset Register and add at least one asset before recording risks.
          </div>
          <div className="mt-4">
            <button
              onClick={() => router.push("/27001/assets")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Go to Assets →
            </button>
          </div>
        </div>
      ) : (
        <RiskTable risks={filteredRisks} setRisks={setRisks} assets={assets} />
      )}
    </div>
  );
}
