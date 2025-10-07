"use client";

import { useAfyaStore } from "@/store/useAfyaStore";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function Home() {
  const { risks, compliance, audits, reminders } = useAfyaStore();

  // Handle undefined state safely
  const totalClauses = compliance?.length || 0;
  const implementedClauses =
    compliance?.filter((c) => c.status === "O" || c.status === "MI").length ||
    0;
  const compliancePercent =
    totalClauses > 0
      ? Math.round((implementedClauses / totalClauses) * 100)
      : 0;

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome to AfyaNumeriq Dashboard
        </h1>
        <p className="text-gray-500 mt-2">
          Overview of key Healthcare Quality Management System metrics.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Total Risks
          </h3>
          <p className="text-4xl font-bold text-teal-600">{risks.length}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Compliance %
          </h3>
          <p className="text-4xl font-bold text-teal-600">
            {compliancePercent}%
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Audits</h3>
          <p className="text-4xl font-bold text-teal-600">{audits.length}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Reminders
          </h3>
          <p className="text-4xl font-bold text-teal-600">
            {reminders?.length || 0}
          </p>
        </div>
      </div>

      {/* Compliance Score - Circular Progress Bar */}
      <div className="mt-10 bg-white p-6 rounded-2xl shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Compliance Score
        </h3>
        <div className="flex justify-center">
          <div className="w-32 h-32">
            <CircularProgressbar
              value={compliancePercent}
              text={`${compliancePercent}%`}
              styles={buildStyles({
                pathColor: "#14b8a6",
                textColor: "#0f766e",
                trailColor: "#e5e7eb",
              })}
            />
          </div>
        </div>
      </div>

      {/* Optional — you can later add charts here */}
      <div className="mt-10 text-gray-500 text-sm italic">
        Live data powered by AfyaNumeriq Compliance & Risk Modules
      </div>
    </div>
  );
}
