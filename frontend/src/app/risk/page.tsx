"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";

type Risk = {
  id: string;
  description: string;
  likelihood: number;
  impact: number;
  score: number;
  level: string;
  control: string;
  action: string;
  owner: string;
  status: string;
  reviewDate: string;
};

export default function RiskPage() {
  const [risks, setRisks] = useState<Risk[]>([
    {
      id: "R-001",
      description: "Power outage affecting ICU",
      likelihood: 4,
      impact: 5,
      score: 20,
      level: "High",
      control: "Backup generator",
      action: "Test generator weekly",
      owner: "Facilities Manager",
      status: "Open",
      reviewDate: "2025-10-30",
    },
  ]);

  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [filter, setFilter] = useState<string>("All");

  const getLevelColor = (level: string) => {
    switch (level) {
      case "High":
        return "bg-red-500 text-white";
      case "Medium":
        return "bg-yellow-500 text-black";
      case "Low":
        return "bg-green-500 text-white";
      default:
        return "";
    }
  };

  const handleSaveRisk = (risk: Risk) => {
    const score = risk.likelihood * risk.impact;
    const level = score >= 15 ? "High" : score >= 8 ? "Medium" : "Low";
    risk.score = score;
    risk.level = level;

    if (editingRisk && editingRisk.id) {
      setRisks(risks.map((r) => (r.id === editingRisk.id ? { ...risk } : r)));
      setEditingRisk(null);
    } else {
      setRisks([...risks, risk]);
    }
  };

  const handleCloseRisk = (id: string) => {
    setRisks(
      risks.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "Closed",
              reviewDate: new Date().toISOString().split("T")[0],
            }
          : r
      )
    );
  };

  const filteredRisks =
    filter === "All" ? risks : risks.filter((r) => r.status === filter);

  // 🔹 Summary counts
  const openCount = risks.filter((r) => r.status === "Open").length;
  const closedCount = risks.filter((r) => r.status === "Closed").length;
  const totalCount = risks.length;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Risk Register</h1>

      {/* 🔹 Summary Widget */}
      <div className="flex space-x-4 mb-4">
        <div className="bg-red-100 text-red-800 px-4 py-2 rounded-md font-semibold">
          Open: {openCount}
        </div>
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-md font-semibold">
          Closed: {closedCount}
        </div>
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-md font-semibold">
          Total: {totalCount}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        {/* Add Risk Button */}
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-md"
              onClick={() =>
                setEditingRisk({
                  id: "",
                  description: "",
                  likelihood: 1,
                  impact: 1,
                  score: 1,
                  level: "Low",
                  control: "",
                  action: "",
                  owner: "",
                  status: "Open",
                  reviewDate: "",
                })
              }
            >
              ➕ Add Risk
            </button>
          </Dialog.Trigger>
        </Dialog.Root>

        {/* Filter Dropdown */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="All">All Risks</option>
          <option value="Open">Open Risks</option>
          <option value="Closed">Closed Risks</option>
        </select>
      </div>

      {/* Risk Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Description</th>
              <th className="p-2 border">Likelihood</th>
              <th className="p-2 border">Impact</th>
              <th className="p-2 border">Score</th>
              <th className="p-2 border">Level</th>
              <th className="p-2 border">Control</th>
              <th className="p-2 border">Action</th>
              <th className="p-2 border">Owner</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Review Date</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRisks.map((risk, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="p-2 border">{risk.id}</td>
                <td className="p-2 border">{risk.description}</td>
                <td className="p-2 border">{risk.likelihood}</td>
                <td className="p-2 border">{risk.impact}</td>
                <td className="p-2 border">{risk.score}</td>
                <td
                  className={`p-2 border font-bold text-center ${getLevelColor(
                    risk.level
                  )}`}
                >
                  {risk.level}
                </td>
                <td className="p-2 border">{risk.control}</td>
                <td className="p-2 border">{risk.action}</td>
                <td className="p-2 border">{risk.owner}</td>
                <td className="p-2 border">{risk.status}</td>
                <td className="p-2 border">{risk.reviewDate}</td>
                <td className="p-2 border space-x-2">
                  <button
                    className="px-2 py-1 text-sm bg-yellow-500 text-white rounded"
                    onClick={() => setEditingRisk(risk)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="px-2 py-1 text-sm bg-gray-600 text-white rounded"
                    onClick={() => handleCloseRisk(risk.id)}
                    disabled={risk.status === "Closed"}
                  >
                    ✅ Close
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Risk Modal */}
      {editingRisk && (
        <Dialog.Root
          open={!!editingRisk}
          onOpenChange={() => setEditingRisk(null)}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/30" />
            <Dialog.Content className="fixed bg-white p-6 rounded-md shadow-md top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px]">
              <Dialog.Title className="text-lg font-bold mb-4">
                {editingRisk.id ? "Edit Risk" : "Add Risk"}
              </Dialog.Title>

              <div className="grid gap-3">
                {Object.keys(editingRisk).map((key) => {
                  if (key === "score" || key === "level") return null; // auto-calculated
                  return (
                    <input
                      key={key}
                      type={key === "reviewDate" ? "date" : "text"}
                      placeholder={key}
                      value={(editingRisk as any)[key]}
                      onChange={(e) =>
                        setEditingRisk({
                          ...editingRisk,
                          [key]:
                            key === "likelihood" || key === "impact"
                              ? Number(e.target.value)
                              : e.target.value,
                        })
                      }
                      className="border p-2 rounded"
                    />
                  );
                })}

                <Dialog.Close asChild>
                  <button
                    onClick={() => handleSaveRisk(editingRisk)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md"
                  >
                    Save
                  </button>
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}
