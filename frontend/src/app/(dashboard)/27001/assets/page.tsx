"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

import Link from "next/link";

/* ------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------ */

type AssetValue = "low" | "medium" | "high";

type Asset = {
  id: number;
  asset_id: string;
  name: string;
  asset_type: string;
  classification: string;
  location: string;
  legal_owner: string;
  technical_owner: string;
  value: AssetValue;
  notes?: string;
};

/* ------------------------------------------------------------------
 * Canonical enum mappings (MATCH BACKEND EXACTLY)
 * ------------------------------------------------------------------ */

const CLASSIFICATION_MAP: Record<string, string> = {
  Public: "public",
  Internal: "internal",
  Confidential: "confidential",
  Restricted: "restricted",
};

const ASSET_TYPE_MAP: Record<string, string> = {
  Information: "information",
  System: "system",
  Infrastructure: "infrastructure",
  Vendor: "vendor",
  Process: "process",
};

function mapBusinessValue(v: number): AssetValue {
  if (v >= 4) return "high";
  if (v === 3) return "medium";
  return "low";
}

/* ------------------------------------------------------------------
 * UI helpers
 * ------------------------------------------------------------------ */


// ...

function WorkflowHeader({ activeStep }: { activeStep: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Assets", href: "/27001/assets" },
    { n: 2, label: "Risks", href: "/27001/risk" }, // ✅ global default
    { n: 3, label: "SoA", href: "/27001/soa" },    // ✅ global default
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


/* ------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------ */

export default function ISO27001AssetsPage() {
  const router = useRouter();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expandedAssetId, setExpandedAssetId] = useState<number | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const assetsPerPage = 10;

  const [form, setForm] = useState({
    name: "",
    asset_type: "Information",
    classification: "Confidential",
    legal_owner: "",
    technical_owner: "",
    location: "",
    business_value: 3,
    notes: "",
  });

  /* ------------------------------------------------------------------
   * Pagination helpers
   * ------------------------------------------------------------------ */
  const totalPages = Math.ceil(assets.length / assetsPerPage);
  const startIdx = (currentPage - 1) * assetsPerPage;
  const endIdx = startIdx + assetsPerPage;
  const paginatedAssets = assets.slice(startIdx, endIdx);

  const selectedAsset = useMemo(
    () => assets.find((a) => a.id === selectedAssetId) || null,
    [assets, selectedAssetId]
  );

  /* ------------------------------------------------------------------
   * Load assets
   * ------------------------------------------------------------------ */
  async function loadAssets() {
    const data = await apiFetch("/isms/assets/?standard=iso-27001");
    setAssets(data);
    setCurrentPage(1); // Reset to page 1 when reloading

    // If there is only 1 asset and none selected, select it by default
    if (data?.length === 1 && !selectedAssetId) {
      setSelectedAssetId(data[0].id);
    }
  }

  useEffect(() => {
    loadAssets().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------------------
   * Create asset
   * ------------------------------------------------------------------ */
  async function createAsset(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const payload = {
        name: form.name.trim(),
        asset_type: ASSET_TYPE_MAP[form.asset_type],
        classification: CLASSIFICATION_MAP[form.classification],
        legal_owner: form.legal_owner.trim(),
        technical_owner: form.technical_owner.trim(),
        location: form.location.trim(),
        value: mapBusinessValue(form.business_value),
        notes: form.notes || "",
        standard: "iso-27001",
      };

      const created = await apiFetch("/isms/assets/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setOpen(false);
      setForm({
        name: "",
        asset_type: "Information",
        classification: "Confidential",
        legal_owner: "",
        technical_owner: "",
        location: "",
        business_value: 3,
        notes: "",
      });

      await loadAssets();

      // Select the newly created asset (best-effort)
      if (created?.id) {
        setSelectedAssetId(created.id);
        setExpandedAssetId(created.id);
      }
    } catch (err) {
      alert("Failed to create asset. Please check required fields.");
    } finally {
      setCreating(false);
    }
  }

  const continueToRisks = () => {
    if (!selectedAssetId) return;
    router.push(`/27001/risk?asset_id=${selectedAssetId}`);
  };

  /* ------------------------------------------------------------------
   * Render
   * ------------------------------------------------------------------ */

  return (
    <div className="p-8 space-y-6">
      {/* Workflow Header */}
      <WorkflowHeader activeStep={1} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            ISO/IEC 27001 Asset Register
          </h1>
          <p className="text-sm text-gray-500">
            Maintain an inventory of information assets as required by ISO/IEC
            27001.
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add New Asset
        </button>
      </div>

      {/* Selected Asset + Continue */}
      <div className="bg-white border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-800">Next step</div>
          <div className="text-sm text-gray-600">
            {selectedAsset ? (
              <>
                Continue to Risks for:{" "}
                <span className="font-semibold text-gray-900">
                  {selectedAsset.name}
                </span>{" "}
                <span className="text-gray-400">({selectedAsset.asset_id})</span>
              </>
            ) : (
              <>Select an asset from the table below to continue to Risks.</>
            )}
          </div>
        </div>

        <button
          onClick={continueToRisks}
          disabled={!selectedAssetId}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Risks →
        </button>
      </div>

      {/* Asset Table - Scrollable with Pagination */}
      <div className="bg-white border rounded-lg overflow-hidden flex flex-col">
        <div
          className="overflow-x-auto overflow-y-auto flex-1"
          style={{ maxHeight: "500px" }}
        >
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left w-24">Asset ID</th>
                <th className="px-4 py-3 text-left min-w-48">Name</th>
                <th className="px-4 py-3 text-left min-w-32">Type</th>
                <th className="px-4 py-3 text-left min-w-40">Classification</th>
                <th className="px-4 py-3 text-left min-w-40">Location</th>
                <th className="px-4 py-3 text-left min-w-32">Legal Owner</th>
                <th className="px-4 py-3 text-left min-w-32">
                  Technical Owner
                </th>
                <th className="px-4 py-3 text-left w-20">Value</th>
              </tr>
            </thead>

            <tbody>
              {paginatedAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                    {assets.length === 0
                      ? "No assets registered yet."
                      : "No assets on this page."}
                  </td>
                </tr>
              ) : (
                paginatedAssets.map((a) => {
                  const isSelected = selectedAssetId === a.id;

                  return (
                    <React.Fragment key={a.id}>
                      {/* Main Row - Clickable to expand + select */}
                      <tr
                        className={`border-t cursor-pointer ${
                          isSelected ? "bg-blue-50" : "hover:bg-blue-50"
                        }`}
                        onClick={() => {
                          setSelectedAssetId(a.id);
                          setExpandedAssetId(expandedAssetId === a.id ? null : a.id);
                        }}
                      >
                        <td className="px-4 py-3 font-semibold text-blue-600">
                          {a.asset_id}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span>{a.name}</span>
                            {isSelected && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white">
                                Selected
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 capitalize">{a.asset_type}</td>
                        <td className="px-4 py-3 capitalize">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100">
                            {a.classification}
                          </span>
                        </td>
                        <td className="px-4 py-3">{a.location}</td>
                        <td className="px-4 py-3 text-sm">{a.legal_owner}</td>
                        <td className="px-4 py-3 text-sm">{a.technical_owner}</td>
                        <td className="px-4 py-3 capitalize">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              a.value === "high"
                                ? "bg-red-100 text-red-700"
                                : a.value === "medium"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {a.value}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {expandedAssetId === a.id && (
                        <tr className="border-t bg-gray-50">
                          <td colSpan={8} className="px-4 py-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500 font-medium">
                                  Asset ID:
                                </span>
                                <p className="text-gray-900">{a.asset_id}</p>
                              </div>
                              <div>
                                <span className="text-gray-500 font-medium">
                                  Name:
                                </span>
                                <p className="text-gray-900">{a.name}</p>
                              </div>
                              <div>
                                <span className="text-gray-500 font-medium">
                                  Type:
                                </span>
                                <p className="text-gray-900 capitalize">
                                  {a.asset_type}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500 font-medium">
                                  Classification:
                                </span>
                                <p className="text-gray-900 capitalize">
                                  {a.classification}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500 font-medium">
                                  Location:
                                </span>
                                <p className="text-gray-900">{a.location}</p>
                              </div>
                              <div>
                                <span className="text-gray-500 font-medium">
                                  Legal Owner:
                                </span>
                                <p className="text-gray-900">{a.legal_owner}</p>
                              </div>
                              <div>
                                <span className="text-gray-500 font-medium">
                                  Technical Owner:
                                </span>
                                <p className="text-gray-900">
                                  {a.technical_owner}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500 font-medium">
                                  Value:
                                </span>
                                <p className="text-gray-900 capitalize">{a.value}</p>
                              </div>
                              {a.notes && (
                                <div className="col-span-2">
                                  <span className="text-gray-500 font-medium">
                                    Notes:
                                  </span>
                                  <p className="text-gray-900 mt-1">{a.notes}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {assets.length > 0 && (
          <div className="bg-gray-50 border-t px-4 py-3 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {startIdx + 1}–{Math.min(endIdx, assets.length)} of{" "}
              {assets.length} assets
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-2 py-1 border rounded text-sm ${
                        currentPage === page
                          ? "bg-blue-600 text-white border-blue-600"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form
            onSubmit={createAsset}
            className="bg-white rounded-lg w-full max-w-xl p-6 space-y-5"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Add New Asset</h2>
              <button type="button" onClick={() => setOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              required
              placeholder="Asset name (As is commonly known in your organization)"
              className="w-full border rounded px-3 py-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium">
                Asset Type (Category best describing the asset)
              </label>
              <select
                className="w-full border rounded px-3 py-2"
                value={form.asset_type}
                onChange={(e) => setForm({ ...form, asset_type: e.target.value })}
              >
                <option>Information</option>
                <option>System</option>
                <option>Infrastructure</option>
                <option>Vendor</option>
                <option>Process</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">
                Information Classification (Sensitivity based on confidentiality requirements)
              </label>
              <select
                className="w-full border rounded px-3 py-2"
                value={form.classification}
                onChange={(e) =>
                  setForm({
                    ...form,
                    classification: e.target.value,
                  })
                }
              >
                <option>Public</option>
                <option>Internal</option>
                <option>Confidential</option>
                <option>Restricted</option>
              </select>
            </div>

            <input
              required
              placeholder="Legal / Business Owner (Person accountable for the asset)"
              className="w-full border rounded px-3 py-2"
              value={form.legal_owner}
              onChange={(e) => setForm({ ...form, legal_owner: e.target.value })}
            />

            <input
              required
              placeholder="Technical Owner (Person responsible for operation and security)"
              className="w-full border rounded px-3 py-2"
              value={form.technical_owner}
              onChange={(e) =>
                setForm({ ...form, technical_owner: e.target.value })
              }
            />

            <input
              required
              placeholder="Location / Hosting (Where the asset is stored or processed)"
              className="w-full border rounded px-3 py-2"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium">
                Business Value (Impact level if compromised)
              </label>
              <select
                className="w-full border rounded px-3 py-2"
                value={form.business_value}
                onChange={(e) =>
                  setForm({
                    ...form,
                    business_value: Number(e.target.value),
                  })
                }
              >
                {[1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              className="w-full border rounded px-3 py-2"
              rows={2}
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="border px-4 py-2 rounded"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                disabled={creating}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create Asset"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
