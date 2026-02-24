"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Props {
  entry: any;
  onUpdate: (updated: any) => void;
}

const STATUS_OPTIONS = ["Not Implemented", "Partial", "Full"];

export default function SoARow({ entry, onUpdate }: Props) {
  const [local, setLocal] = useState(entry);
  const [loading, setLoading] = useState(false);

  // Keep local state in sync if parent updates
  useEffect(() => {
    setLocal(entry);
  }, [entry]);

  const patchEntry = async (patch: any) => {
    setLoading(true);
    try {
      const updated = await apiFetch(
        `/27001/soa/entries/${local.id}/`,
        {
          method: "PATCH",
          body: JSON.stringify(patch),
        }
      );
      setLocal(updated);
      onUpdate(updated); // ✅ triggers SoA summary refresh in table
    } catch (err: any) {
      alert(
        err?.message ||
          "Justification is required for inclusion or exclusion of a control."
      );
      // rollback UI
      setLocal(entry);
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr className={`${!local.applicable ? "bg-gray-50 text-gray-400" : ""}`}>
      {/* CONTROL */}
      <td className="px-3 py-2 align-top">
        <div className="font-medium">{local.control?.code ?? "—"}</div>
        <div className="text-xs text-gray-500">{local.control?.title ?? ""}</div>

        {Array.isArray(local.linked_risks) && local.linked_risks.length > 0 && (
          <ul className="mt-1 text-xs ml-4 list-disc">
            {local.linked_risks.map((r: any) => (
              <li key={r.risk_id}>
                {r.risk_code}
                {r.asset_name ? ` — ${r.asset_name}` : ""}
              </li>
            ))}
          </ul>
        )}
      </td>

      {/* APPLICABLE */}
      <td className="px-3 py-2 text-center align-top">
        <input
          type="checkbox"
          checked={!!local.applicable}
          disabled={loading}
          onChange={(e) => {
            if (!e.target.checked && !local.justification?.trim()) {
              alert("Justification is required to exclude a control.");
              return;
            }
            setLocal((prev: any) => ({
              ...prev,
              applicable: e.target.checked,
            }));
            patchEntry({ applicable: e.target.checked });
          }}
        />
      </td>

      {/* STATUS */}
      <td className="px-3 py-2 text-center align-top">
        <select
          value={local.status}
          disabled={!local.applicable || loading}
          onChange={(e) => {
            const next = e.target.value;
            setLocal((prev: any) => ({ ...prev, status: next }));
            patchEntry({ status: next });
          }}
          className="border rounded px-2 py-1 text-sm"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </td>

      {/* JUSTIFICATION */}
      <td className="px-3 py-2 align-top">
        <textarea
          defaultValue={local.justification || ""}
          rows={2}
          disabled={loading}
          onBlur={(e) => {
            const v = e.target.value;
            if (v !== local.justification) {
              setLocal((prev: any) => ({ ...prev, justification: v }));
              patchEntry({ justification: v });
            }
          }}
          className="w-full border rounded px-2 py-1 text-sm"
        />
      </td>

      {/* EVIDENCE NOTES */}
      <td className="px-3 py-2 align-top">
        <textarea
          defaultValue={local.evidence_notes || ""}
          rows={2}
          disabled={loading}
          onBlur={(e) => {
            const v = e.target.value;
            if (v !== local.evidence_notes) {
              setLocal((prev: any) => ({ ...prev, evidence_notes: v }));
              patchEntry({ evidence_notes: v });
            }
          }}
          className="w-full border rounded px-2 py-1 text-sm"
        />
      </td>
    </tr>
  );
}
