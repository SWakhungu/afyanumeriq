"use client";

import { useState } from "react";
import RiskRow from "./RiskRow";
import AddRiskModal from "./AddRiskModal";

interface Props {
  risks: any[];
  setRisks: (r: any[]) => void;
  assets: any[];
}

export default function RiskTable({ risks, setRisks, assets }: Props) {
  const [open, setOpen] = useState(false);

  const updateRisk = (updated: any) => {
    setRisks(risks.map((r) => (r.id === updated.id ? updated : r)));
  };

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex justify-end">
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Risk
        </button>
      </div>

      {/* Risk table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Risk</th>
              <th className="px-3 py-2 text-left">Asset</th>
              <th className="px-3 py-2 text-center">L × I</th>
              <th className="px-3 py-2 text-center">Score</th>
              <th className="px-3 py-2 text-left">Controls</th>
              <th className="px-3 py-2 text-center">Coverage</th>
              <th className="px-3 py-2 text-center">Treatment</th>
            </tr>
          </thead>

          <tbody>
            {risks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-400">
                  No risks registered yet.
                </td>
              </tr>
            ) : (
              risks.map((risk) => (
                <RiskRow
                  key={risk.id}
                  risk={risk}
                  onUpdate={updateRisk}
                  assets={assets}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Risk modal */}
      {open && (
        <AddRiskModal
          assets={assets}
          onClose={() => setOpen(false)}
          onCreated={(risk) => setRisks([...risks, risk])}
        />
      )}
    </div>
  );
}
