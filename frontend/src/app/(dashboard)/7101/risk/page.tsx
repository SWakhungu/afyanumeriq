"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

type Risk = {
  id: number;
  risk_id: string;
  description: string;
  likelihood: number | string;
  impact: number | string;
  risk_score: number;
  risk_level: string;
  owner: string;
  status: "Open" | "Closed";
  existing_control?: string | null;
  treatment_action?: string | null;
  review_date: string;
  archived: boolean; // 🔽 NEW
};

type StatusFilter = "" | "All" | "Open" | "Closed" | "Archived";

export default function RiskPage() {
  const { show } = useToast();

  const [risks, setRisks] = useState<Risk[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [owners, setOwners] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    minScore: 0,
    maxScore: 25,
    level: "",
    owner: "",
    status: "All" as StatusFilter, // default = active All
  });
  const [sortBy, setSortBy] = useState("score_desc");

  // Add Risk modal state
  const [openAdd, setOpenAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    risk_id: "",
    description: "",
    likelihood: 1,
    impact: 1,
    owner: "",
    status: "Open",
    existing_control: "",
    treatment_action: "",
    review_date: "",
  });

  // Archive confirm
  const [confirmArchiveId, setConfirmArchiveId] = useState<number | null>(null);

  // Build query for backend based on status (archived handling)
  function buildQueryForStatus(status: StatusFilter) {
    // Default behavior: exclude archived
    if (status === "Archived") return "?archived=true";
    if (status === "Open") return "?status=Open"; // archived=False by default
    if (status === "Closed") return "?status=Closed"; // archived=False by default
    // "All" (active only), or "" -> return empty (archived=False by default)
    return "";
  }

  async function loadRisks(status: StatusFilter = filters.status) {
    const q = buildQueryForStatus(status);
    const data = await apiFetch(`/risks/${q}`);
    setRisks(data);

    const lvl = Array.from(
      new Set(data.map((r: Risk) => r.risk_level).filter(Boolean))
    );
    const own = Array.from(
      new Set(data.map((r: Risk) => r.owner).filter(Boolean))
    );
    setLevels(lvl);
    setOwners(own);
  }

  useEffect(() => {
    loadRisks().catch((e) =>
      show(`Failed to load risks: ${e.message}`, "error")
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-load when status filter changes (to include/exclude archived server-side)
  useEffect(() => {
    loadRisks(filters.status).catch((e) =>
      show(`Failed to load risks: ${e.message}`, "error")
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status]);

  // Derived: filtered + sorted (client-side for other filters)
  const filtered = useMemo(() => {
    let result = risks.filter((r) => {
      const scoreMatch =
        r.risk_score >= filters.minScore && r.risk_score <= filters.maxScore;
      const levelMatch = filters.level ? r.risk_level === filters.level : true;
      const ownerMatch = filters.owner ? r.owner === filters.owner : true;
      // status already applied via server except when "All"
      return scoreMatch && levelMatch && ownerMatch;
    });

    if (sortBy === "score_asc") {
      result = result.sort((a, b) => a.risk_score - b.risk_score);
    } else if (sortBy === "score_desc") {
      result = result.sort((a, b) => b.risk_score - a.risk_score);
    } else if (sortBy === "level") {
      const order = ["Low", "Medium", "High", "Critical"];
      result = result.sort(
        (a, b) => order.indexOf(a.risk_level) - order.indexOf(b.risk_level)
      );
    }
    return [...result];
  }, [
    risks,
    filters.minScore,
    filters.maxScore,
    filters.level,
    filters.owner,
    sortBy,
  ]);

  const resetFilters = () => {
    setFilters({
      minScore: 0,
      maxScore: 25,
      level: "",
      owner: "",
      status: "All",
    });
    setSortBy("score_desc");
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Low":
        return "bg-green-100 text-green-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const getMeterColor = (level: string) => {
    switch (level) {
      case "Low":
        return "bg-green-500";
      case "Medium":
        return "bg-yellow-400";
      case "High":
        return "bg-orange-500";
      case "Critical":
        return "bg-red-600";
      default:
        return "bg-gray-400";
    }
  };

  // Create Risk (unchanged)
  async function onCreateRisk(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        risk_id: form.risk_id,
        description: form.description,
        likelihood: Number(form.likelihood),
        impact: Number(form.impact),
        owner: form.owner,
        status: form.status,
        existing_control: form.existing_control || "",
        treatment_action: form.treatment_action || "",
        review_date: form.review_date,
      };
      const created = await apiFetch("/risks/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setOpenAdd(false);
      setForm({
        risk_id: "",
        description: "",
        likelihood: 1,
        impact: 1,
        owner: "",
        status: "Open",
        existing_control: "",
        treatment_action: "",
        review_date: "",
      });
      setRisks((prev) => [created, ...prev]);
      // hydrate dropdowns
      setLevels((prev) =>
        Array.from(new Set([...prev, created.risk_level].filter(Boolean)))
      );
      setOwners((prev) =>
        Array.from(new Set([...prev, created.owner].filter(Boolean)))
      );
      show(`Risk ${created.risk_id} created`, "success");
    } catch (err: any) {
      show(`Failed to create risk: ${err.message}`, "error");
    } finally {
      setCreating(false);
    }
  }

  // Update status inline (allowed even for Closed -> Open; disabled when archived)
  async function onChangeStatus(id: number, status: "Open" | "Closed") {
    try {
      const updated = await apiFetch(`/risks/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setRisks((prev) => prev.map((r) => (r.id === id ? updated : r)));
      show(`Risk ${updated.risk_id} marked ${updated.status}`, "success");
    } catch (e: any) {
      show(`Failed to update status: ${e.message}`, "error");
    }
  }

  // Archive (confirmation)
  async function onArchiveConfirmed() {
    if (!confirmArchiveId) return;
    try {
      const updated = await apiFetch(`/risks/${confirmArchiveId}/`, {
        method: "PATCH",
        body: JSON.stringify({ archived: true }),
      });
      setRisks((prev) =>
        prev.map((r) => (r.id === confirmArchiveId ? updated : r))
      );
      setConfirmArchiveId(null);
      show(`Risk ${updated.risk_id} archived`, "success");
    } catch (e: any) {
      show(`Failed to archive: ${e.message}`, "error");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Risk Register</h1>
        <Button onClick={() => setOpenAdd(true)}>Add Risk</Button>
      </div>

      {/* Filters */}
      <Card className="p-4 space-y-4">
        <h2 className="font-semibold text-lg">Filters</h2>
        <div className="grid md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium">Score Range</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={filters.minScore}
                onChange={(e) =>
                  setFilters({ ...filters, minScore: Number(e.target.value) })
                }
                className="w-20 border rounded p-1"
              />
              <span>-</span>
              <input
                type="number"
                value={filters.maxScore}
                onChange={(e) =>
                  setFilters({ ...filters, maxScore: Number(e.target.value) })
                }
                className="w-20 border rounded p-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Risk Level</label>
            <select
              value={filters.level}
              onChange={(e) =>
                setFilters({ ...filters, level: e.target.value })
              }
              className="w-full border rounded p-1"
            >
              <option value="">All</option>
              {levels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Owner</label>
            <select
              value={filters.owner}
              onChange={(e) =>
                setFilters({ ...filters, owner: e.target.value })
              }
              className="w-full border rounded p-1"
            >
              <option value="">All</option>
              {owners.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Status</label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: e.target.value as StatusFilter,
                })
              }
              className="w-full border rounded p-1"
            >
              <option value="All">All</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border rounded p-1"
            >
              <option value="score_desc">Score (High → Low)</option>
              <option value="score_asc">Score (Low → High)</option>
              <option value="level">Risk Level</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </Card>

      {/* Risk Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => (
          <Card key={r.id} className="p-4 space-y-3 hover:shadow-md transition">
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{r.risk_id}</span>
                {/* Archived badge (gray) */}
                {r.archived && <Badge variant="secondary">Archived</Badge>}
              </div>
              <Badge className={getLevelColor(r.risk_level)}>
                {r.risk_level}
              </Badge>
            </div>

            <p className="text-sm text-gray-700">{r.description}</p>

            {/* Score meter */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-gray-600">
                <span>
                  Score: {r.risk_score} (L{String(r.likelihood)} × I
                  {String(r.impact)})
                </span>
                <span>{Math.round((r.risk_score / 25) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className={`h-2 rounded-full ${getMeterColor(r.risk_level)}`}
                  style={{ width: `${(r.risk_score / 25) * 100}%` }}
                />
              </div>
            </div>

            <div className="text-sm">
              <strong>Owner:</strong> {r.owner}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm flex items-center gap-2">
                <strong>Status:</strong>
                <select
                  value={r.status}
                  onChange={(e) =>
                    onChangeStatus(r.id, e.target.value as "Open" | "Closed")
                  }
                  className="border rounded px-2 py-1 text-sm"
                  disabled={r.archived} // archived are read-only
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              {/* Archive button only when Closed AND not already archived */}
              {!r.archived && r.status === "Closed" && (
                <Button
                  variant="outline"
                  onClick={() => setConfirmArchiveId(r.id)}
                >
                  Archive Risk
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Add Risk Modal (unchanged from your current) */}
      {openAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold">Add Risk</h3>
            <form onSubmit={onCreateRisk} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Risk ID</label>
                  <input
                    className="w-full border rounded p-2"
                    value={form.risk_id}
                    onChange={(e) =>
                      setForm({ ...form, risk_id: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Owner</label>
                  <input
                    className="w-full border rounded p-2"
                    value={form.owner}
                    onChange={(e) =>
                      setForm({ ...form, owner: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea
                  className="w-full border rounded p-2"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium">
                    Likelihood (1–5)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    className="w-full border rounded p-2"
                    value={form.likelihood}
                    onChange={(e) =>
                      setForm({ ...form, likelihood: Number(e.target.value) })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Impact (1–5)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    className="w-full border rounded p-2"
                    value={form.impact}
                    onChange={(e) =>
                      setForm({ ...form, impact: Number(e.target.value) })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Review Date
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded p-2"
                    value={form.review_date}
                    onChange={(e) =>
                      setForm({ ...form, review_date: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">
                    Existing Control
                  </label>
                  <input
                    className="w-full border rounded p-2"
                    value={form.existing_control}
                    onChange={(e) =>
                      setForm({ ...form, existing_control: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Treatment Action
                  </label>
                  <input
                    className="w-full border rounded p-2"
                    value={form.treatment_action}
                    onChange={(e) =>
                      setForm({ ...form, treatment_action: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenAdd(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create Risk"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {confirmArchiveId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold">Archive this risk?</h3>
            <p className="text-sm text-gray-600">
              You will still be able to view it under <strong>Archived</strong>{" "}
              risks, but it will no longer count as active.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmArchiveId(null)}
              >
                Cancel
              </Button>
              <Button onClick={onArchiveConfirmed}>Archive Risk</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
