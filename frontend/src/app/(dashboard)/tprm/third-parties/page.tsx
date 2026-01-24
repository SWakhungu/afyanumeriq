import Link from "next/link";
import { Network, Plus } from "lucide-react";

export default function ThirdPartiesPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Third Parties
          </h1>
          <p className="text-sm text-gray-600 mt-1 w-full">
            Register and manage third parties that introduce risk to your
            organization through external dependencies, including operational,
            security, financial, legal, and strategic risks.
          </p>
        </div>

        <Link
          href="/tprm/third-parties/new"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          <Plus size={16} />
          Add Third Party
        </Link>
      </div>

      {/* Filters (MVP – visual only) */}
      <div className="flex flex-wrap gap-3">
        <FilterPill label="All" active />
        <FilterPill label="Critical" />
        <FilterPill label="High" />
        <FilterPill label="Medium" />
        <FilterPill label="Low" />
      </div>

      {/* Third Parties Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Registered Third Parties
          </h2>
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Name</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Criticality</th>
                <th className="pb-2">Scope of Dependency</th>
                <th className="pb-2">Linked Risks</th>
                <th className="pb-2">Next Review</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>

            <tbody>
              {/* Empty state */}
              <tr>
                <td
                  colSpan={7}
                  className="py-6 text-center text-gray-400 italic"
                >
                  No third parties have been registered yet.
                </td>
              </tr>

              {/*
              Example row (for later wiring)

              <tr className="border-b last:border-b-0 hover:bg-gray-50 cursor-pointer">
                <td className="py-3 font-medium text-gray-900">
                  <Link href="/tprm/third-parties/aws">AWS</Link>
                </td>
                <td>Cloud Provider</td>
                <td>Critical</td>
                <td>Infrastructure & Data Hosting</td>
                <td>4</td>
                <td>2026-01-31</td>
                <td>Active</td>
              </tr>
              */}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guidance / Intent Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        <p className="flex items-start gap-2 max-w-4xl">
          <Network size={18} className="text-blue-600 mt-0.5" />
          Third parties should be registered and assessed based on how their
          services affect your organization's operations, regulatory
          obligations, data handling, resilience, and strategic objectives — not
          procurement value alone.
        </p>
      </div>
    </div>
  );
}

/* ---------------- Helper Components ---------------- */

function FilterPill({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}
