"use client";

import { useState } from "react";
import { useAfyaStore } from "@/store/useAfyaStore";
import { Button } from "@/components/ui/button";

export default function RiskRegister() {
  const { risks, addRisk, updateRiskStatus } = useAfyaStore();
  const [newRisk, setNewRisk] = useState("");

  const handleAddRisk = () => {
    if (!newRisk.trim()) return;
    const id = Math.random().toString(36).slice(2);
    addRisk({ id, description: newRisk, level: "Medium", status: "Open" });
    setNewRisk("");
  };

  const handleClose = (id: string) => updateRiskStatus(id, "Closed");

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Risk Register</h1>
      <div className="flex mb-4 gap-2">
        <input
          type="text"
          value={newRisk}
          onChange={(e) => setNewRisk(e.target.value)}
          placeholder="Enter risk description"
          className="border p-2 rounded w-full"
        />
        <Button onClick={handleAddRisk}>Add</Button>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2">ID</th>
            <th className="p-2">Description</th>
            <th className="p-2">Level</th>
            <th className="p-2">Status</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {risks.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-2">{r.id}</td>
              <td className="p-2">{r.description}</td>
              <td className="p-2">{r.level}</td>
              <td className="p-2">{r.status}</td>
              <td className="p-2">
                {r.status === "Open" && (
                  <Button onClick={() => handleClose(r.id)}>Mark Closed</Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
