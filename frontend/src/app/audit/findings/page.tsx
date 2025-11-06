"use client";

import { useAfyaStore } from "@/store/useAfyaStore";
import { Button } from "@/components/ui/button";

export default function Findings() {
  const { findings, addFinding, updateFindingStatus } = useAfyaStore();

  const handleAddFinding = () => {
    const id = Math.random().toString(36).slice(2);
    addFinding({ id, status: "Open" });
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Audit Findings</h1>
      <Button onClick={handleAddFinding}>Add Finding</Button>
      <table className="w-full mt-4 border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2">ID</th>
            <th className="p-2">Status</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((f) => (
            <tr key={f.id} className="border-t">
              <td className="p-2">{f.id}</td>
              <td className="p-2">{f.status}</td>
              <td className="p-2">
                {f.status === "Open" && (
                  <Button onClick={() => updateFindingStatus(f.id, "Closed")}>
                    Mark Closed
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
