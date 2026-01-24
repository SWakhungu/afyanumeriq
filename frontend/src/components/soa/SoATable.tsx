import SoARow from "./SoARow";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Props {
  entries: any[];
  setEntries: (entries: any[]) => void;
}

export default function SoATable({ entries, setEntries }: Props) {
  const [soaPercent, setSoAPercent] = useState<number | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const refreshSoASummary = async () => {
    try {
      setLoadingSummary(true);
      const data = await apiFetch("/27001/soa/summary/");
      setSoAPercent(data.completeness_percent);
    } catch (err) {
      console.error("Failed to load SoA summary", err);
      setSoAPercent(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  // ✅ Load summary once when table mounts
  useEffect(() => {
    refreshSoASummary();
  }, []);

  const updateRow = (updated: any) => {
    setEntries(entries.map((e) => (e.id === updated.id ? updated : e)));
    refreshSoASummary(); // ✅ recalc after changes
  };

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-gray-600">Live SoA Completeness</p>

        <span className="font-semibold text-green-600">
          {loadingSummary
            ? "…"
            : soaPercent !== null
            ? `${soaPercent}%`
            : "—"}
        </span>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Control</th>
              <th className="px-3 py-2">Applicable</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Justification</th>
              <th className="px-3 py-2">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-6 text-center text-gray-400"
                >
                  No Statement of Applicability entries yet.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <SoARow
                  key={entry.id}
                  entry={entry}
                  onUpdate={updateRow}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
