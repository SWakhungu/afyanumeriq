"use client";

import { useAfyaStore } from "@/store/useAfyaStore";
import { Card, CardContent } from "@/components/ui/card";

export default function ReportsDashboard() {
  const { risks, audits, complianceRecords } = useAfyaStore();

  // --- Risk Summary ---
  const totalRisks = risks.length;
  const closedRisks = risks.filter((r) => r.status === "Closed").length;
  const openRisks = totalRisks - closedRisks;
  const riskClosureRate =
    totalRisks > 0 ? ((closedRisks / totalRisks) * 100).toFixed(1) : 0;

  // --- Audit Summary ---
  const totalAudits = audits.length;
  const completedAudits = audits.filter((a) => a.status === "Completed").length;
  const auditCompletionRate =
    totalAudits > 0 ? ((completedAudits / totalAudits) * 100).toFixed(1) : 0;

  // --- Compliance Summary ---
  const scoreMap: Record<string, number> = {
    NI: 0,
    P: 25,
    IP: 50,
    MI: 75,
    O: 100,
  };
  const complianceScores = complianceRecords.map(
    (c) => scoreMap[c.status] || 0
  );
  const averageCompliance =
    complianceScores.length > 0
      ? (
          complianceScores.reduce((a, b) => a + b, 0) / complianceScores.length
        ).toFixed(1)
      : 0;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-teal-700">
        AfyaNumeriq Reports Dashboard
      </h1>
      <p className="text-gray-600">
        Real-time summary of risk, audit, and compliance performance.
      </p>

      {/* Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Risk Overview */}
        <Card className="bg-white shadow-md rounded-xl border border-gray-200">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">
              Risk Overview
            </h2>
            <p>Total Risks: {totalRisks}</p>
            <p>Open Risks: {openRisks}</p>
            <p>Closed Risks: {closedRisks}</p>
            <p className="font-medium text-teal-600">
              Closure Rate: {riskClosureRate}%
            </p>
          </CardContent>
        </Card>

        {/* Audit Overview */}
        <Card className="bg-white shadow-md rounded-xl border border-gray-200">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">
              Audit Overview
            </h2>
            <p>Total Audits: {totalAudits}</p>
            <p>Completed Audits: {completedAudits}</p>
            <p className="font-medium text-blue-600">
              Completion Rate: {auditCompletionRate}%
            </p>
          </CardContent>
        </Card>

        {/* Compliance Overview */}
        <Card className="bg-white shadow-md rounded-xl border border-gray-200">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">
              Compliance Overview
            </h2>
            <p>Clauses Reviewed: {complianceRecords.length}</p>
            <p className="font-medium text-green-600">
              Average Compliance: {averageCompliance}%
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
