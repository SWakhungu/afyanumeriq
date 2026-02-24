"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import ControlMultiSelect from "./ControlMultiSelect";
import { getRiskMeaning } from "@/lib/riskMeaning";

interface Asset {
  id: number;
  asset_id: string;
  name: string;
}

interface Risk {
  id: number;
  title: string;
  description: string;
  asset?: Asset | null;
  likelihood: number;
  impact: number;
  risk_score: number;
  level: string;
  treatment: string;
  control_coverage: string;
  controls: { id: number; code: string; title: string }[];
  acceptance_justification?: string;
}

interface Props {
  risk: Risk;
  onUpdate: (updated: Risk) => void;
  assets?: Asset[];
}

export default function RiskRow({ risk, onUpdate, assets = [] }: Props) {
  const [loading, setLoading] = useState(false);

  const [editTitle, setEditTitle] = useState(false);
  const [editAsset, setEditAsset] = useState(false);
  const [editLikelihood, setEditLikelihood] = useState(false);
  const [editImpact, setEditImpact] = useState(false);

  const [title, setTitle] = useState(risk.title);
  const [assetId, setAssetId] = useState<number | "">(risk.asset?.id ?? "");
  const [likelihood, setLikelihood] = useState(risk.likelihood);
  const [impact, setImpact] = useState(risk.impact);

  useEffect(() => {
    setTitle(risk.title);
    setAssetId(risk.asset?.id ?? "");
    setLikelihood(risk.likelihood);
    setImpact(risk.impact);
  }, [risk]);

  async function patchRisk(patch: Partial<Risk>) {
    setLoading(true);
    try {
      const updated = await apiFetch(`/isms/risks/${risk.id}/`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      onUpdate(updated);
    } catch (err: any) {
      const msg =
        err?.acceptance_justification?.[0] ||
        err?.message ||
        "Failed to update risk.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  }

  const meaning = getRiskMeaning(
    risk.treatment || "Reduce",
    risk.control_coverage
  );

  return (
    <tr className={loading ? "opacity-50 pointer-events-none" : ""}>
      {/* Risk */}
      <td className="px-3 py-2 align-top">
        {editTitle ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (title.trim() !== risk.title) {
                patchRisk({ title: title.trim() });
              }
              setEditTitle(false);
            }}
            className="w-full border rounded px-2 py-1 text-sm font-medium"
          />
        ) : (
          <div
            onClick={() => setEditTitle(true)}
            className="cursor-pointer hover:bg-gray-100 px-1 rounded"
          >
            <div className="font-medium">{risk.title}</div>

            {risk.description && (
              <div className="text-sm text-gray-500 mt-1">
                {risk.description}
              </div>
            )}
          </div>
        )}
      </td>

      {/* Asset */}
      <td className="px-3 py-2 align-top text-sm">
        {editAsset ? (
          <select
            autoFocus
            value={assetId}
            onChange={(e) =>
              setAssetId(e.target.value ? Number(e.target.value) : "")
            }
            onBlur={() => {
              patchRisk({ asset_id: assetId === "" ? null : assetId } as any);
              setEditAsset(false);
            }}
            className="w-full border rounded px-2 py-1 text-sm"
          >
            <option value="">Unassigned</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        ) : (
          <div
            onClick={() => setEditAsset(true)}
            className="cursor-pointer hover:bg-gray-100 px-1 rounded"
          >
            {risk.asset ? (
              <>
                <div className="font-medium">{risk.asset.name}</div>
                <div className="text-xs text-gray-500">
                  {risk.asset.asset_id}
                </div>
              </>
            ) : (
              <span className="text-gray-400">(Unassigned)</span>
            )}
          </div>
        )}
      </td>

      {/* L × I */}
      <td className="px-3 py-2 text-center text-xs align-top">
        <div className="flex justify-center gap-1">
          {editLikelihood ? (
            <select
              autoFocus
              value={likelihood}
              onChange={(e) => setLikelihood(Number(e.target.value))}
              onBlur={() => {
                patchRisk({ likelihood });
                setEditLikelihood(false);
              }}
              className="border rounded px-1 py-1 text-xs w-10"
            >
              {[1, 2, 3, 4, 5].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          ) : (
            <span
              onClick={() => setEditLikelihood(true)}
              className="cursor-pointer font-semibold hover:bg-gray-100 px-1 rounded"
            >
              L:{risk.likelihood}
            </span>
          )}

          <span className="text-gray-400">×</span>

          {editImpact ? (
            <select
              autoFocus
              value={impact}
              onChange={(e) => setImpact(Number(e.target.value))}
              onBlur={() => {
                patchRisk({ impact });
                setEditImpact(false);
              }}
              className="border rounded px-1 py-1 text-xs w-10"
            >
              {[1, 2, 3, 4, 5].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          ) : (
            <span
              onClick={() => setEditImpact(true)}
              className="cursor-pointer font-semibold hover:bg-gray-100 px-1 rounded"
            >
              I:{risk.impact}
            </span>
          )}
        </div>
      </td>

      {/* Score */}
      <td className="px-3 py-2 text-center font-semibold align-top">
        {risk.risk_score}
      </td>

      {/* Controls */}
      <td className="px-3 py-2 align-top">
        <ControlMultiSelect
          value={risk.controls.map((c) => c.id)}
          onChange={(ids) => patchRisk({ controls: ids } as any)}
        />
      </td>

      {/* Coverage */}
      <td className="px-3 py-2 text-center align-top">
        {risk.treatment !== "Reduce" ? (
          <span
            title={meaning}
            className="text-xs italic text-gray-500 cursor-help"
          >
            N/A
          </span>
        ) : (
          <span
            title={meaning}
            className={`text-xs font-semibold px-2 py-1 rounded cursor-help ${
              risk.control_coverage === "Adequate"
                ? "bg-green-100 text-green-700"
                : risk.control_coverage === "Partial"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {risk.control_coverage}
          </span>
        )}
      </td>

      {/* Treatment */}
      <td className="px-3 py-2 text-center align-top">
        <select
          value={risk.treatment || "Reduce"}
          onChange={(e) => patchRisk({ treatment: e.target.value })}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="Reduce">Reduce</option>
          <option value="Accept">Accept</option>
          <option value="Transfer">Transfer</option>
          <option value="Avoid">Avoid</option>
        </select>
      </td>

      {/* Acceptance Justification */}
      {risk.treatment !== "Reduce" && (
        <td className="px-3 py-2 align-top">
          <textarea
            defaultValue={risk.acceptance_justification || ""}
            placeholder="Provide justification for this treatment decision"
            rows={2}
            className="w-full border rounded px-2 py-1 text-xs"
            onBlur={(e) => {
              if (e.target.value !== risk.acceptance_justification) {
                patchRisk({ acceptance_justification: e.target.value });
              }
            }}
          />
        </td>
      )}
    </tr>
  );
}
