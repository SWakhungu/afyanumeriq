// src/components/ClauseCard.tsx
"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch, apiUpload } from "@/lib/api";

import {
  Status,
  STATUSES,
  STATUS_LABELS,
  STATUS_BADGE_CLASS,
  isValidTransition,
  isUpgrade,
} from "@/lib/statusRules";

type Clause = {
  id: number;
  clause_number: string;
  description?: string;
  short_description?: string;
  status: Status;
  evidence?: string | string[] | null;
  owner?: string | null;
  comments?: string | null;
  last_updated?: string;
};

type Props = {
  clause: Clause;
  standard?: string; // e.g. "iso-27001"
  onChange?: (updated: Clause) => void;
};

// Normalize backend evidence shape: string | string[] | null → string[]
function normalizeEvidence(evidence?: string | string[] | null): string[] {
  if (!evidence) return [];
  if (Array.isArray(evidence)) return evidence.filter(Boolean);
  return [evidence];
}

function clauseDetailPath(standard: string | undefined, id: number) {
  if (standard === "iso-27001") return `/27001/clauses/${id}/`;
  return `/compliance/${id}/`;
}

function clauseEvidencePath(standard: string | undefined, id: number) {
  if (standard === "iso-27001") return `/27001/clauses/${id}/evidence/`;
  return `/compliance/${id}/evidence/`;
}

export default function ClauseCard({ clause, standard, onChange }: Props) {
  const { show } = useToast();

  const [saving, setSaving] = useState(false);

  // status
  const [localStatus, setLocalStatus] = useState<Status>(clause.status);

  // owner inline edit
  const [editingOwner, setEditingOwner] = useState(false);
  const [localOwner, setLocalOwner] = useState(clause.owner || "");

  // comments inline edit
  const [editingComments, setEditingComments] = useState(false);
  const [localComments, setLocalComments] = useState(clause.comments || "");

  const evidenceList = useMemo(
    () => normalizeEvidence(clause.evidence),
    [clause.evidence],
  );
  const hasEvidence = evidenceList.length > 0;

  async function patchClause(payload: Partial<Clause>) {
    return apiFetch(clauseDetailPath(standard, clause.id), {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async function handleStatusChange(next: Status) {
    const prev = localStatus;

    if (!isValidTransition(prev, next)) {
      setLocalStatus(prev);
      show("Only one-step status changes are allowed.", "info");
      return;
    }

    if (
      isUpgrade(prev, next) &&
      (next === "MI" || next === "O") &&
      !hasEvidence
    ) {
      setLocalStatus(prev);
      show("You must upload evidence before upgrading to MI or O.", "info");
      return;
    }

    try {
      setSaving(true);
      setLocalStatus(next);

      const updated = await patchClause({ status: next });

      show(
        `Clause ${clause.clause_number} set to ${STATUS_LABELS[next]}`,
        "success",
      );

      onChange?.({
        ...clause,
        ...updated,
        status: next,
      });
    } catch (e: any) {
      setLocalStatus(prev);
      show(
        `Failed to update status: ${e?.message || "Unknown error"}`,
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveOwner() {
    const nextOwner = (localOwner || "").trim() || "Unassigned";

    try {
      setSaving(true);
      const updated = await patchClause({ owner: nextOwner });
      show("Owner updated ✅", "success");
      setEditingOwner(false);
      onChange?.({
        ...clause,
        ...updated,
        owner: updated?.owner ?? nextOwner,
      });
    } catch (err: any) {
      show(
        `Failed to update owner: ${err?.message || "Unknown error"}`,
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveComments() {
    try {
      setSaving(true);
      const updated = await patchClause({ comments: localComments || "" });
      show("Comments updated ✅", "success");
      setEditingComments(false);
      onChange?.({
        ...clause,
        ...updated,
        comments: updated?.comments ?? localComments,
      });
    } catch (err: any) {
      show(
        `Failed to update comments: ${err?.message || "Unknown error"}`,
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-4 flex flex-col gap-3">
      {/* Header: number + badge */}
      <div className="flex items-start justify-between">
        <span className="font-semibold">{clause.clause_number}</span>
        <Badge className={STATUS_BADGE_CLASS[localStatus]}>
          {STATUS_LABELS[localStatus]}
        </Badge>
      </div>

      {/* Requirement text: prefer full description if present */}
      <p className="font-semibold">
        {clause.description || clause.short_description || ""}
      </p>

      {/* Owner & Comments */}
      <div className="text-sm space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">Owner:</span>

          {!editingOwner ? (
            <>
              <span
                className={
                  !clause.owner || clause.owner === "Unassigned"
                    ? "opacity-50"
                    : ""
                }
              >
                {clause.owner || "Unassigned"}
              </span>

              <button
                type="button"
                onClick={() => {
                  setLocalOwner(clause.owner || "");
                  setEditingOwner(true);
                }}
                className="ml-2 text-xs text-gray-500 hover:text-gray-700"
                disabled={saving}
              >
                Edit
              </button>
            </>
          ) : (
            <span className="flex items-center gap-2">
              <input
                type="text"
                value={localOwner}
                onChange={(e) => setLocalOwner(e.target.value)}
                className="px-2 py-1 border rounded"
                disabled={saving}
              />
              <button
                type="button"
                onClick={saveOwner}
                className="px-2 py-1 bg-teal-600 text-white rounded text-sm"
                disabled={saving}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocalOwner(clause.owner || "");
                  setEditingOwner(false);
                }}
                className="px-2 py-1 border rounded text-sm"
                disabled={saving}
              >
                Cancel
              </button>
            </span>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between">
            <span className="font-medium">Comments:</span>
            {!editingComments && (
              <button
                type="button"
                onClick={() => setEditingComments(true)}
                className="ml-2 text-xs text-gray-500 hover:text-gray-700"
                disabled={saving}
              >
                Edit
              </button>
            )}
          </div>
          {!editingComments ? (
            <span className={`italic ${!clause.comments ? "opacity-50" : ""}`}>
              {clause.comments || "No comments"}
            </span>
          ) : (
            <div className="mt-2 space-y-2">
              <textarea
                value={localComments}
                onChange={(e) => setLocalComments(e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
                rows={3}
                placeholder="Add optional comments..."
                disabled={saving}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveComments}
                  className="px-2 py-1 bg-teal-600 text-white rounded text-sm"
                  disabled={saving}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLocalComments(clause.comments || "");
                    setEditingComments(false);
                  }}
                  className="px-2 py-1 border rounded text-sm"
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Evidence */}
      <div className="text-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="font-medium">Evidence:</span>{" "}
            {evidenceList.length === 0 ? (
              <span className="opacity-60">—</span>
            ) : (
              <ul className="list-disc ml-5">
                {evidenceList.map((ev, i) => (
                  <li key={i} className="break-all">
                    <a
                      href={ev}
                      className="underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {ev.split("/").pop()}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Upload shown in IP stage */}
          {localStatus === "IP" && !saving && (
            <div className="shrink-0">
              <input
                type="file"
                id={`evidence-${standard || "std"}-${clause.id}`}
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  try {
                    setSaving(true);

                    const formData = new FormData();
                    formData.append("evidence", file);

                    const updated = await apiUpload(
                      clauseEvidencePath(standard, clause.id),
                      formData,
                    );

                    show("Evidence uploaded successfully ✅", "success");

                    // Backend might return evidence, evidence_url, or evidence_urls — be tolerant
                    const nextEvidence =
                      updated?.evidence ??
                      updated?.evidence_url ??
                      updated?.evidence_urls ??
                      clause.evidence;

                    onChange?.({
                      ...clause,
                      ...updated,
                      evidence: nextEvidence,
                    });
                  } catch (err: any) {
                    show(
                      `Failed to upload evidence: ${
                        err?.message || "Unknown error"
                      }`,
                      "error",
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
              />

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  document
                    .getElementById(
                      `evidence-${standard || "std"}-${clause.id}`,
                    )
                    ?.click()
                }
              >
                Upload Evidence
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown status selector */}
      <div className="flex items-center gap-2">
        <label className="text-sm opacity-75">Change status:</label>

        <select
          className="border rounded px-2 py-1"
          disabled={saving}
          value={localStatus}
          onChange={(e) => handleStatusChange(e.target.value as Status)}
        >
          {STATUSES.map((s) => {
            const oneStep = isValidTransition(localStatus, s);
            const needsEvidence =
              isUpgrade(localStatus, s) &&
              (s === "MI" || s === "O") &&
              !hasEvidence;

            const disabled = s === localStatus || !oneStep || needsEvidence;

            return (
              <option key={s} value={s} disabled={disabled}>
                {STATUS_LABELS[s]}
              </option>
            );
          })}
        </select>

        {saving && <span className="text-sm opacity-75">Saving…</span>}
      </div>
    </Card>
  );
}
