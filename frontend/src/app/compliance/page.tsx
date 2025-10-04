"use client";

import { useAfyaStore } from "@/store/useAfyaStore";

export default function Compliance() {
  const { complianceRecords, addCompliance, updateComplianceStatus } =
    useAfyaStore();

  const handleAdd = () => {
    const id = Math.random().toString(36).slice(2);
    addCompliance({ id, status: "NI" });
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Compliance Tracker</h1>
      <button
        onClick={handleAdd}
        className="bg-teal-600 text-white px-4 py-2 rounded mb-4"
      >
        Add Item
      </button>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2">ID</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {complianceRecords.map((item) => (
            <tr key={item.id} className="border-t">
              <td className="p-2">{item.id}</td>
              <td className="p-2">
                <select
                  value={item.status}
                  onChange={(e) =>
                    updateComplianceStatus(item.id, e.target.value as any)
                  }
                  className="border p-1 rounded"
                >
                  <option value="NI">NI</option>
                  <option value="P">P</option>
                  <option value="IP">IP</option>
                  <option value="MI">MI</option>
                  <option value="O">O</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
