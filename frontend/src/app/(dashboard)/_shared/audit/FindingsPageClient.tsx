"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type Finding = {
  id: number;
  finding_id: string;
  description: string;
  severity: "Low" | "Medium" | "High";
  status: "Open" | "Closed";
  corrective_action?: string;
  target_date: string;
  completion_date?: string | null;
  audit: number;
};

type Severity = "Low" | "Medium" | "High";

export default function FindingsPageClient({ standard }: { standard: string }) {
  const { show } = useToast();
  const { user } = useAuthStore();
  const access = useAuthStore((s) => s.access);

  const searchParams = useSearchParams();
  const auditId = searchParams.get("audit_id");

  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingFinding, setEditingFinding] = useState<Finding | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<"all" | "Open" | "Closed">(
    "all",
  );
  const [severityFilter, setSeverityFilter] = useState<"all" | Severity>("all");

  // Form state
  const [form, setForm] = useState({
    finding_id: "",
    description: "",
    severity: "Medium" as Severity,
    corrective_action: "",
    target_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (!auditId) return;
    if (!access) return;
    loadFindings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditId, access, standard]);

  const loadFindings = async () => {
    if (!auditId) return;
    try {
      setLoading(true);
      // ✅ FIX: use the passed-in standard (no hardcoding iso-27001)
      const data = await apiFetch(
        `/audits/${auditId}/findings/?standard=${standard}`,
      );
      setFindings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      show(`Failed to load findings: ${err.message}`, "error");
      setFindings([]);
    } finally {
      setLoading(false);
    }
  };

  const saveFinding = async () => {
    if (!auditId) return;
    if (!form.finding_id || !form.description || !form.target_date) {
      show("Please fill in all required fields", "error");
      return;
    }

    try {
      setLoading(true);
      const payload = { ...form, audit: parseInt(auditId) };

      if (editingFinding) {
        await apiFetch(`/findings/${editingFinding.id}/`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        show("Finding updated ✅", "success");
      } else {
        await apiFetch(`/audits/${auditId}/findings/?standard=${standard}`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        show("Finding created ✅", "success");
      }

      resetForm();
      setShowModal(false);
      loadFindings();
    } catch (err: any) {
      show(`Failed to save finding: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const closeFinding = async (findingId: number) => {
    try {
      setLoading(true);

      // ✅ FIX: include completion_date on close (common backend requirement)
      const completion_date = new Date().toISOString().split("T")[0];

      await apiFetch(`/findings/${findingId}/`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "Closed",
          completion_date,
        }),
      });

      show("Finding closed ✅", "success");
      loadFindings();
    } catch (err: any) {
      show(`Failed to close finding: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      finding_id: "",
      description: "",
      severity: "Medium",
      corrective_action: "",
      target_date: new Date().toISOString().split("T")[0],
    });
    setEditingFinding(null);
  };

  const openEditModal = (finding: Finding) => {
    setEditingFinding(finding);
    setForm({
      finding_id: finding.finding_id,
      description: finding.description,
      severity: finding.severity,
      corrective_action: finding.corrective_action || "",
      target_date: finding.target_date,
    });
    setShowModal(true);
  };

  const filteredFindings = findings.filter((f) => {
    if (statusFilter !== "all" && f.status !== statusFilter) return false;
    if (severityFilter !== "all" && f.severity !== severityFilter) return false;
    return true;
  });

  const isAdmin = user?.profile?.role === "admin";
  const isAuditor = user?.profile?.role === "auditor";
  const canCreateEdit = isAdmin || isAuditor;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Findings</h1>
          <p className="text-sm text-gray-500">
            Standard: <span className="font-medium">{standard}</span>
            {auditId ? (
              <>
                {" "}
                • Audit ID: <span className="font-medium">{auditId}</span>
              </>
            ) : null}
          </p>
        </div>

        {canCreateEdit && (
          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            + Add Finding
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border rounded-lg text-sm"
          >
            <option value="all">All</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Severity</label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="px-4 py-2 border rounded-lg text-sm"
          >
            <option value="all">All</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <Card className="p-6 space-y-4 border-teal-200 bg-teal-50">
          <h2 className="text-xl font-semibold">
            {editingFinding ? "Edit Finding" : "Create New Finding"}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Finding ID
              </label>
              <input
                type="text"
                value={form.finding_id}
                onChange={(e) =>
                  setForm({ ...form, finding_id: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="e.g., F-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                rows={4}
                placeholder="Describe the finding..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Severity
                </label>
                <select
                  value={form.severity}
                  onChange={(e) =>
                    setForm({ ...form, severity: e.target.value as Severity })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={form.target_date}
                  onChange={(e) =>
                    setForm({ ...form, target_date: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Corrective Action
              </label>
              <textarea
                value={form.corrective_action}
                onChange={(e) =>
                  setForm({ ...form, corrective_action: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
                placeholder="What action will be taken..."
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={saveFinding} disabled={loading}>
                {loading ? "Saving..." : "Save Finding"}
              </Button>
              <Button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Findings Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">ID</th>
                <th className="px-6 py-3 text-left font-semibold">
                  Description
                </th>
                <th className="px-6 py-3 text-left font-semibold">Severity</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">
                  Target Date
                </th>
                <th className="px-6 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFindings.map((finding) => (
                <tr key={finding.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium">
                    {finding.finding_id}
                  </td>
                  <td className="px-6 py-3 text-gray-700 max-w-xs truncate">
                    {finding.description}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        finding.severity === "High"
                          ? "bg-red-100 text-red-800"
                          : finding.severity === "Medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {finding.severity}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        finding.status === "Open"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {finding.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-xs">
                    {new Date(finding.target_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 space-x-2">
                    {canCreateEdit && (
                      <>
                        <button
                          onClick={() => openEditModal(finding)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          Edit
                        </button>
                        {finding.status === "Open" && (
                          <button
                            onClick={() => closeFinding(finding.id)}
                            className="text-green-600 hover:text-green-800 text-xs font-medium"
                          >
                            Close
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFindings.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            {findings.length === 0
              ? "No findings yet. Create one to get started."
              : "No findings match your filters."}
          </div>
        )}
      </Card>
    </div>
  );
}
