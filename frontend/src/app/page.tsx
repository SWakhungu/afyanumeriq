"use client";

import { PieChart, Pie, Cell } from "recharts";

const COLORS = ["#14b8a6", "#e5e7eb"]; // teal + light gray
const complianceData = [
  { name: "Compliance", value: 72 },
  { name: "Remaining", value: 28 },
];

export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Compliance Status */}
        <div className="p-6 border rounded-lg shadow bg-white flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-4">Compliance Status</h2>
          <PieChart width={200} height={200}>
            <Pie
              data={complianceData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
            >
              {complianceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
          <p className="text-2xl font-bold mt-2 text-teal-600">72%</p>
        </div>

        {/* Audits */}
        <div className="p-6 border rounded-lg shadow bg-white">
          <h2 className="text-lg font-semibold mb-4">Audits</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex justify-between">
              <span>Internal Audit</span>
              <span className="text-sm text-gray-500">Due Jan 12</span>
            </li>
            <li className="flex justify-between">
              <span>External Audit</span>
              <span className="text-sm text-gray-500">Due Mar 04</span>
            </li>
          </ul>
        </div>

        {/* Reminders */}
        <div className="p-6 border rounded-lg shadow bg-white">
          <h2 className="text-lg font-semibold mb-4">Reminders</h2>
          <ul className="space-y-2 text-gray-700">
            <li>2 nonconformities pending closure</li>
            <li>1 risk review due in 3 days</li>
            <li>3 documents pending upload</li>
          </ul>
        </div>
      </div>

      {/* Risk Register Preview */}
      <div className="p-6 border rounded-lg bg-white shadow">
        <h2 className="text-lg font-semibold mb-4">Risk Register (Preview)</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th className="py-2">ID</th>
              <th>Description</th>
              <th>Likelihood</th>
              <th>Impact</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2">R001</td>
              <td>Patient data breach</td>
              <td>High</td>
              <td>Critical</td>
              <td>IT Manager</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">R002</td>
              <td>Staff shortage in ER</td>
              <td>Medium</td>
              <td>High</td>
              <td>HR</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
