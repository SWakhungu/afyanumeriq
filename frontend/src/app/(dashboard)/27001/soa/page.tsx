"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import SoATable from "@/components/soa/SoATable";
import { useRouter, useSearchParams } from "next/navigation";

import Link from "next/link";

function WorkflowHeader({ activeStep }: { activeStep: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Assets", href: "/27001/assets" },
    { n: 2, label: "Risks", href: "/27001/risk" }, // ✅ global
    { n: 3, label: "SoA", href: "/27001/soa" },    // ✅ global
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
          <Link
            key={s.n}
            href={s.href}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
              activeStep === s.n
                ? "bg-blue-600 text-white border-blue-600"
                : activeStep > s.n
                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
            }`}
            title={`Go to ${s.label}`}
          >
            {s.n}. {s.label}
            {idx < steps.length - 1 ? (
              <span className="ml-2 text-gray-300">→</span>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function SoAPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assetIdParam = searchParams.get("asset_id");
  const assetId = assetIdParam ? Number(assetIdParam) : null;

  const [soaEntries, setSoAEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Optional: show asset context label if available
  const [assets, setAssets] = useState<any[]>([]);

  useEffect(() => {
    apiFetch("/27001/soa/?standard=iso-27001")
      .then((data) => setSoAEntries(data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // purely for context display (non-blocking)
    apiFetch("/isms/assets/?standard=iso-27001")
      .then((data) => setAssets(data || []))
      .catch(() => {});
  }, []);

  const selectedAsset = useMemo(() => {
    if (!assetId) return null;
    return assets.find((a: any) => a.id === assetId) || null;
  }, [assets, assetId]);

  return (
    <div className="p-6 space-y-4">
      <WorkflowHeader activeStep={3} />

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">
            ISO/IEC 27001 — Statement of Applicability
          </h1>
          <p className="text-sm text-gray-500">
            Justify inclusion/non-inclusion of Annex A controls and record implementation evidence.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() =>
              router.push(assetId ? `/27001/risk?asset_id=${assetId}` : "/27001/risk")
            }
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            ← Back to Risks
          </button>

          <button
            onClick={() => router.push("/27001/reports")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Reports →
          </button>
        </div>
      </div>

      {/* Context box (optional) */}
      <div className="bg-white border rounded-lg p-4 text-sm text-gray-700">
        <div className="font-semibold text-gray-900">Context</div>
        <div className="text-gray-600">
          {assetId ? (
            selectedAsset ? (
              <>
                Viewing SoA after working on asset:{" "}
                <span className="font-semibold text-gray-900">
                  {selectedAsset.name}
                </span>{" "}
                <span className="text-gray-400">({selectedAsset.asset_id})</span>
              </>
            ) : (
              <>Viewing SoA after working on asset ID: {assetId}</>
            )
          ) : (
            <>Viewing the full SoA for ISO/IEC 27001.</>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 italic">Loading SoA…</p>
      ) : (
        <SoATable entries={soaEntries} setEntries={setSoAEntries} />
      )}
    </div>
  );
}
