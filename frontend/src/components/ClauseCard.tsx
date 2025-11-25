"use client";

import { useState, useMemo } from "react";
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
  description: string;
  short_description: string;
  status: Status;
  evidence?: string | string[] | null;
  owner: string;
  comments?: string | null;
  last_updated?: string;
};

// Normalize backend evidence shape: string | string[] | null → string[]
function normalizeEvidence(evidence?: string | string[] | null): string[] {
  if (!evidence) return [];
  if (Array.isArray(evidence)) return evidence.filter(Boolean);
  return [evidence];
}

type Props = {
  clause: Clause;
  onChange?: (updated: Clause) => void;
};

export default function ClauseCard({ clause, onChange }: Props) {
  const { show } = useToast();
  const [saving, setSaving] = useState(false);
  const [localStatus, setLocalStatus] = useState<Status>(clause.status);
  const [editingOwner, setEditingOwner] = useState(false);
  const [localOwner, setLocalOwner] = useState(clause.owner || "");

  const evidenceList = useMemo(
    () => normalizeEvidence(clause.evidence),
    [clause.evidence]
  );
  const hasEvidence = evidenceList.length > 0;

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

      await apiFetch(`/compliance/${clause.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });

      show(
        `Clause ${clause.clause_number} set to ${STATUS_LABELS[next]}`,
        "success"
      );
      onChange?.({ ...clause, status: next });
    } catch (e: any) {
      setLocalStatus(prev);
      show(
        `Failed to update status: ${e?.message || "Unknown error"}`,
        "error"
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

      {/* Requirement text */}
      <p className="font-semibold">{clause.short_description}</p>

      {/* Owner & Comments */}
      <div className="text-sm space-y-1">
        <div>
          <span className="font-medium">Owner:</span>{" "}
          {!editingOwner ? (
            <span className={clause.owner === "Unassigned" ? "opacity-50" : ""}>
              {clause.owner}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <input
                type="text"
                value={localOwner}
                onChange={(e) => setLocalOwner(e.target.value)}
                className="px-2 py-1 border rounded"
              />
              <button
                onClick={async () => {
                  try {
                    setSaving(true);
                    const updated = await apiFetch(
                      `/compliance/${clause.id}/`,
                      {
                        method: "PATCH",
                        body: JSON.stringify({ owner: localOwner }),
                      }
                    );
                    show("Owner updated ✅", "success");
                    setEditingOwner(false);
                    onChange?.({ ...clause, owner: updated.owner });
                  } catch (err: any) {
                    show(
                      `Failed to update owner: ${
                        err?.message || "Unknown error"
                      }`,
                      "error"
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
                className="px-2 py-1 bg-teal-600 text-white rounded text-sm"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setLocalOwner(clause.owner || "");
                  setEditingOwner(false);
                }}
                className="px-2 py-1 border rounded text-sm"
              >
                Cancel
              </button>
            </span>
          )}
          <button
            onClick={() => setEditingOwner(!editingOwner)}
            className="ml-3 text-xs text-gray-500 hover:text-gray-700"
          >
            {editingOwner ? "Edit" : "Edit"}
          </button>
        </div>
        {clause.comments && (
          <div>
            <span className="font-medium">Comments:</span>{" "}
            <span className="italic">{clause.comments}</span>
          </div>
        )}
      </div>

      {/* Evidence */}
      <div className="text-sm">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-medium">Evidence:</span>{" "}
            {evidenceList.length === 0 ? (
              <span className="opacity-60">—</span>
            ) : (
              <ul className="list-disc ml-5">
                {evidenceList.map((ev, i) => (
                  <li key={i}>
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

          {/* Upload button only shown in IP stage */}
          {localStatus === "IP" && !saving && (
            <div className="shrink-0">
              <input
                type="file"
                id={`evidence-${clause.id}`}
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  try {
                    setSaving(true);
                    const formData = new FormData();
                    formData.append("evidence", file);

                    const updated = await apiUpload(
                      `/compliance/${clause.id}/evidence/`,
                      formData
                    );

                    show("Evidence uploaded successfully ✅", "success");

                    onChange?.({
                      ...clause,
                      evidence: updated.evidence_url,
                    });
                  } catch (err: any) {
                    show(
                      `Failed to upload evidence: ${
                        err?.message || "Unknown error"
                      }`,
                      "error"
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
                  document.getElementById(`evidence-${clause.id}`)?.click()
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

            const disabled =
              s === localStatus ||
              (!oneStep && s !== localStatus) ||
              needsEvidence;

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
