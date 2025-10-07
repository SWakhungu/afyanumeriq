"use client";

import { useAfyaStore } from "@/store/useAfyaStore";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { useMemo } from "react";

export default function ReportsDashboard() {
  // Use selectors with fallbacks to avoid undefined
  const risks = useAfyaStore((s) => s.risks ?? []);
  const compliance = useAfyaStore((s) => s.complianceRecords ?? []);
  const audits = useAfyaStore((s) => s.audits ?? []);

  // === Metrics ===
  const totalRisks = risks.length;
  const openRisks = risks.filter((r) => r.status === "Open").length;
  const mitigatedRisks = risks.filter((r) => r.status === "Mitigated").length;
  const closedRisks = risks.filter((r) => r.status === "Closed").length;

  const totalClauses = compliance.length;
  const optimizedClauses = compliance.filter((c) => c.status === "O").length;
  const complianceRate = totalClauses
    ? Math.round((optimizedClauses / totalClauses) * 100)
    : 0;

  const totalAudits = audits.length;
  const completedAudits = audits.filter((a) => a.status === "Completed").length;

  // === Chart Data ===
  const riskData = useMemo(
    () => [
      { name: "Open", value: openRisks },
      { name: "Mitigated", value: mitigatedRisks },
      { name: "Closed", value: closedRisks },
    ],
    [openRisks, mitigatedRisks, closedRisks]
  );

  const COLORS = ["#f87171", "#facc15", "#34d399"]; // red, yellow, green

  // === Dynamic Notifications ===
  const notifications = useMemo(() => {
    const now = new Date();
    const notes: { id: number; message: string; type: string }[] = [];
    let counter = 1;

    // Risk alerts (open > 30 days). Try multiple possible created fields.
    risks.forEach((r) => {
      const createdRaw =
        (r as any).createdAt ??
        (r as any).created_at ??
        (r as any).created ??
        null;
      if (r.status === "Open" && createdRaw) {
        const created = new Date(createdRaw);
        if (!isNaN(created.getTime())) {
          const diffDays = Math.floor(
            (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDays > 30) {
            notes.push({
              id: counter++,
              message: `Risk "${
                r.description ?? r.riskDescription ?? "Unnamed risk"
              }" has been open for ${diffDays} days.`,
              type: "alert",
            });
          }
        }
      }
    });

    // Audit reminders (due in <= 3 days). Support a.date or a.dueDate or a.target_date
    audits.forEach((a) => {
      const dueRaw =
        (a as any).dueDate ?? (a as any).date ?? (a as any).target_date ?? null;
      if (a.status !== "Completed" && dueRaw) {
        const due = new Date(dueRaw);
        if (!isNaN(due.getTime())) {
          const diffDays = Math.floor(
            (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDays <= 3 && diffDays >= 0) {
            notes.push({
              id: counter++,
              message: `Audit "${
                a.name ?? a.audit_name ?? "Unnamed audit"
              }" is due in ${diffDays} day${diffDays === 1 ? "" : "s"}.`,
              type: "warning",
            });
          }
        }
      }
    });

    // Compliance pending items (NI, P, IP)
    compliance.forEach((c) => {
      const status = (c as any).status ?? "";
      if (["NI", "P", "IP"].includes(status)) {
        notes.push({
          id: counter++,
          message: `Clause ${(c as any).clause ?? (c as any).id ?? "N/A"}: ${
            (c as any).description?.slice(0, 80) ?? ""
          } still pending full implementation.`,
          type: "info",
        });
      }
    });

    if (notes.length === 0) {
      notes.push({
        id: 0,
        message: "✅ All systems healthy. No pending alerts.",
        type: "success",
      });
    }

    return notes;
  }, [risks, compliance, audits]);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-semibold text-gray-800">
        Dashboard Overview
      </h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4 text-center">
            <h2 className="text-gray-500">Total Risks</h2>
            <p className="text-2xl font-bold">{totalRisks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <h2 className="text-gray-500">Compliance Rate</h2>
            <p className="text-2xl font-bold text-emerald-600">
              {complianceRate}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <h2 className="text-gray-500">Audits Completed</h2>
            <p className="text-2xl font-bold">{completedAudits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <h2 className="text-gray-500">Total Clauses</h2>
            <p className="text-2xl font-bold">{totalClauses}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart and Notifications */}
      <div className="flex flex-col md:flex-row gap-8 mt-8">
        <div className="flex-1 flex justify-center">
          <PieChart width={300} height={300}>
            <Pie
              data={riskData}
              cx="50%"
              cy="50%"
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {riskData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>

        {/* Dynamic Notifications */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-3 text-gray-700">
            Notifications & Reminders
          </h2>
          <div className="space-y-3">
            {notifications.map((note) => (
              <div
                key={note.id}
                className={`border-l-4 p-3 rounded shadow-sm ${
                  note.type === "warning"
                    ? "border-yellow-400 bg-yellow-50"
                    : note.type === "info"
                    ? "border-blue-400 bg-blue-50"
                    : note.type === "alert"
                    ? "border-red-400 bg-red-50"
                    : "border-green-400 bg-green-50"
                }`}
              >
                <p className="text-gray-700">{note.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
