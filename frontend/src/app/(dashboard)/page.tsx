"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/card";

type DashboardStats = {
  active_risks: number;
  risk_heatmap: Record<string, number>;
  audits_completed: number;
  audits_overdue: number;
  open_findings: number;
  overdue_findings: number;
  compliance_score: number; // 0..100 backend %
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    apiFetch("/dashboard-stats/").then(setStats);
  }, []);

  if (!stats) {
    return (
      <div className="p-8">
        <p className="text-gray-500 italic">Loading dashboard...</p>
      </div>
    );
  }

  const score = stats.compliance_score ?? 0;

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (value: number) => {
    if (value >= 75) return "#15803d";
    if (value >= 50) return "#4ade80";
    if (value >= 25) return "#eab308";
    if (value > 0) return "#f97316";
    return "#dc2626";
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-semibold text-gray-800">
        HQMS Dashboard Overview
      </h1>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4 text-center">
          <h2 className="text-gray-500">Active Risks</h2>
          <p className="text-2xl font-bold">{stats.active_risks}</p>
        </Card>

        <Card className="p-4 text-center">
          <h2 className="text-gray-500">Open Findings</h2>
          <p className="text-2xl font-bold">{stats.open_findings}</p>
        </Card>

        <Card className="p-4 text-center">
          <h2 className="text-gray-500">Audits Completed</h2>
          <p className="text-2xl font-bold">{stats.audits_completed}</p>
        </Card>

        <Card className="p-4 text-center">
          <h2 className="text-gray-500">Compliance Score</h2>
          <p className="text-2xl font-bold">{score}%</p>
        </Card>
      </div>

      {/* Compliance Donut */}
      <div className="flex justify-center pt-4">
        <Card className="w-64 h-64 flex items-center justify-center relative">
          <svg width="180" height="180" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="#e5e7eb"
              strokeWidth="12"
              fill="none"
            />

            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke={getColor(score)}
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{
                transition: "stroke-dashoffset 0.8s ease, stroke 0.4s ease",
              }}
            />
          </svg>

          <div className="absolute text-center">
            <p className="text-3xl font-bold">{score}%</p>
            <p className="text-sm text-gray-600">Compliant</p>
          </div>
        </Card>
      </div>

      <div className="mt-10 text-gray-500 text-sm italic">
        Live ISO 7101 data powered by AfyaNumeriq Compliance & Risk Modules
      </div>
    </div>
  );
}
