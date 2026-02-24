"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AddAuditModal from "./AddAuditModal";
import { useToast } from "@/components/ui/use-toast";

type Finding = {
  id: number;
  finding_id: string;
  description: string;
  severity: "Low" | "Medium" | "High";
  corrective_action: string;
  status: "Open" | "Closed";
  target_date: string;
};

type Audit = {
  id: number;
  audit_id: string;
  audit_name: string;
  objective?: string;
  scope?: string;
  participants?: string;
  lead_auditor?: string;
  date: string;
  status: "Scheduled" | "In Progress" | "Completed";
  findings: Finding[];
};

const STATUS_BADGE = (status: string) =>
  status === "Completed" ? "success" : "secondary";

function stdPrefixFromCode(standard: string) {
  // iso-7101 => /7101, iso-27001 => /27001
  const code = (standard || "iso-7101").replace("iso-", "");
  return `/${code}`;
}

export default function AuditPageClient({ standard }: { standard: string }) {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState<
    "All" | "Scheduled" | "In Progress" | "Completed"
  >("All");

  const [findingsFilter, setFindingsFilter] = useState<
    "All audits" | "With open findings" | "No open findings"
  >("All audits");

  const [openModal, setOpenModal] = useState(false);
  const { show } = useToast();

  const hasOpenFindings = (a: Audit) =>
    a.findings?.some((f) => f.status === "Open");
  const findingsFilterDisabled = statusFilter !== "Completed";
  const base = stdPrefixFromCode(standard);

  const filteredFindings = useMemo(() => {
    let list = audits;
    if (statusFilter !== "All")
      list = list.filter((a) => a.status === statusFilter);

    if (statusFilter === "Completed") {
      if (findingsFilter === "With open findings")
        list = list.filter(hasOpenFindings);
      if (findingsFilter === "No open findings")
        list = list.filter((a) => !hasOpenFindings(a));
    }

    return list;
  }, [audits, statusFilter, findingsFilter]);

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const data = (await apiFetch(`/audits/?standard=${standard}`)) as Audit[];
      let list = data ?? [];

      if (statusFilter !== "All")
        list = list.filter((a) => a.status === statusFilter);

      if (statusFilter === "Completed") {
        if (findingsFilter === "With open findings")
          list = list.filter(hasOpenFindings);
        if (findingsFilter === "No open findings")
          list = list.filter((a) => !hasOpenFindings(a));
      }

      setAudits(list);
    } catch (e) {
      console.error(e);
      show("Failed to load audits", "error");
      setAudits([]);
    } finally {
      setLoading(false);
    }
  };

  const changeAuditStatus = async (
    auditId: number,
    newStatus: "Scheduled" | "In Progress" | "Completed",
  ) => {
    try {
      await apiFetch(`/audits/${auditId}/update_status/`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      show(`Audit marked as ${newStatus}`, "success");
      fetchAudits();
    } catch (e: any) {
      show(
        `Failed to update audit status: ${e?.message || "Unknown error"}`,
        "error",
      );
    }
  };

  useEffect(() => {
    fetchAudits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [standard, statusFilter, findingsFilter]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Audit & Findings</h1>

      {/* Filters + Schedule */}
      <div className="flex flex-col md:flex-row gap-3 mb-5 items-center">
        <div className="flex items-center gap-2">
          <label className="font-medium">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border p-2 rounded"
          >
            <option value="All">All</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="font-medium">Findings:</label>
          <select
            value={findingsFilterDisabled ? "All audits" : findingsFilter}
            onChange={(e) => setFindingsFilter(e.target.value as any)}
            className={`border p-2 rounded ${
              findingsFilterDisabled ? "opacity-60 cursor-not-allowed" : ""
            }`}
            disabled={findingsFilterDisabled}
          >
            <option value="All audits">
              {findingsFilterDisabled
                ? 'Disabled until "Completed" is selected'
                : "All audits"}
            </option>
            <option value="With open findings">With open findings</option>
            <option value="No open findings">No open findings</option>
          </select>
        </div>

        <Button className="ml-auto" onClick={() => setOpenModal(true)}>
          Schedule Audit
        </Button>
      </div>

      {loading ? (
        <p>Loading audits...</p>
      ) : audits.length === 0 ? (
        <p className="text-gray-500 italic">No audits found.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {audits.map((a) => (
            <Card key={a.id} className="p-4 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-semibold text-lg">{a.audit_name}</h2>
                  <p className="text-sm text-gray-600">
                    Lead: {a.lead_auditor || "—"} | Date:{" "}
                    {new Date(a.date).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_BADGE(a.status)}>{a.status}</Badge>

                  {/* Status dropdown to change audit status */}
                  <select
                    value={a.status}
                    onChange={(e) =>
                      changeAuditStatus(a.id, e.target.value as any)
                    }
                    className="border rounded px-2 py-1 text-sm"
                    disabled={loading}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>

                  {/* ✅ Standard-scoped findings route */}
                  <Link href={`${base}/audit/findings?audit_id=${a.id}`}>
                    <button className="border rounded px-3 py-1 text-sm hover:bg-gray-50">
                      View Findings
                    </button>
                  </Link>
                </div>
              </div>

              {(a.scope || a.participants || a.objective) && (
                <div className="mt-3 text-sm text-gray-700 space-y-1">
                  {a.scope && (
                    <p>
                      <span className="font-semibold">Scope:</span> {a.scope}
                    </p>
                  )}
                  {a.participants && (
                    <p>
                      <span className="font-semibold">Participants:</span>{" "}
                      {a.participants}
                    </p>
                  )}
                  {a.objective && (
                    <p>
                      <span className="font-semibold">Objective:</span>{" "}
                      {a.objective}
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <AddAuditModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={fetchAudits}
        standard={standard}
      />
    </div>
  );
}
