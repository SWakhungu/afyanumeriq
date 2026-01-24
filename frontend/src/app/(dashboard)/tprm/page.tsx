import { Network, AlertTriangle, Clock, ShieldCheck } from "lucide-react";

export default function TPRMPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Third Party Risk Management
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Identify, assess, and monitor risks arising from third-party relationships,
        including security, operational, financial, legal, and strategic risks.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          title="Total Third Parties"
          value="—"
          icon={<Network className="text-teal-700" size={20} />}
        />
        <KpiCard
          title="Critical Third Parties"
          value="—"
          icon={<AlertTriangle className="text-amber-600" size={20} />}
        />
        <KpiCard
          title="High-Risk Vendor Risks"
          value="—"
          icon={<ShieldCheck className="text-red-600" size={20} />}
        />
        <KpiCard
          title="Overdue Reviews"
          value="—"
          icon={<Clock className="text-blue-700" size={20} />}
        />
      </div>

      {/* High-Risk Third-Party Risks */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            High-Risk Third-Party Risks
          </h2>
        </div>

        <div className="p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Risk</th>
                <th className="pb-2">Third Party</th>
                <th className="pb-2">Inherent</th>
                <th className="pb-2">Residual</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b last:border-b-0">
                <td className="py-3 text-gray-400 italic" colSpan={5}>
                  No high-risk third-party risks recorded yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Alerts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Upcoming & Overdue Reviews
          </h2>
        </div>

        <div className="p-4">
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="italic text-gray-400">
              No upcoming or overdue third-party reviews.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* --- Small KPI Card Component --- */
function KpiCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4 shadow-sm">
      <div className="p-2 bg-gray-50 rounded-md">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">
          {title}
        </p>
        <p className="text-xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
