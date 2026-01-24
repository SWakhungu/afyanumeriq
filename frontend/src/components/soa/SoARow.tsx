"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

interface Props {
  entry: any;
  onUpdate: (updated: any) => void;
}

const STATUS_OPTIONS = ["Not Implemented", "Partial", "Full"];

export default function SoARow({ entry, onUpdate }: Props) {
  const [local, setLocal] = useState(entry);
  const [loading, setLoading] = useState(false);

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
      onUpdate(updated);
    } catch (err: any) {
      alert(
        err?.data?.justification?.[0] ??
        "Justification is required for inclusion or exclusion of a control."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr className={`${!local.applicable ? "bg-gray-50 text-gray-400" : ""}`}>
      <td className="px-3 py-2 align-top">
        <div className="font-medium">
          {local.control?.code ?? "—"}
        </div>
        <div className="text-xs text-gray-500">
          {local.control?.title ?? ""}
        </div>

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

      <td className="px-3 py-2 text-center align-top">
        <input
          type="checkbox"
          checked={local.applicable}
          onChange={(e) => {
            if (!e.target.checked && !local.justification?.trim()) {
              alert("Justification is required to exclude a control.");
              return;
            }
            patchEntry({ applicable: e.target.checked });
          }}
        />
      </td>

      <td className="px-3 py-2 text-center align-top">
        <select
          value={local.status}
          disabled={!local.applicable}
          onChange={(e) => patchEntry({ status: e.target.value })}
          className="border rounded px-2 py-1 text-sm"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </td>

      <td className="px-3 py-2 align-top">
        <textarea
          defaultValue={local.justification || ""}
          rows={2}
          onBlur={(e) =>
            e.target.value !== local.justification &&
            patchEntry({ justification: e.target.value })
          }
          className="w-full border rounded px-2 py-1 text-sm"
        />
      </td>

      <td className="px-3 py-2 align-top">
        <textarea
          defaultValue={local.evidence_notes || ""}
          rows={2}
          onBlur={(e) =>
            e.target.value !== local.evidence_notes &&
            patchEntry({ evidence_notes: e.target.value })
          }
          className="w-full border rounded px-2 py-1 text-sm"
        />
      </td>
    </tr>
  );
}
