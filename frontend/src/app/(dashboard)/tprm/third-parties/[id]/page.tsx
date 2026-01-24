import {
  Network,
  AlertTriangle,
  FileText,
  ClipboardCheck,
} from "lucide-react";

export default function ThirdPartyDetailPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Third Party Profile
        </h1>
        <p className="text-sm text-gray-600 mt-1 max-w-4xl">
          Overview of the third-party relationship, associated risks, assessments,
          and management decisions.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Criticality"
          value="Critical"
          icon={<AlertTriangle size={18} className="text-amber-600" />}
        />
        <SummaryCard
          title="Active Risks"
          value="—"
          icon={<Network size={18} className="text-teal-700" />}
        />
        <SummaryCard
          title="Last Assessment"
          value="—"
          icon={<ClipboardCheck size={18} className="text-blue-700" />}
        />
        <SummaryCard
          title="Next Review"
          value="—"
          icon={<FileText size={18} className="text-purple-700" />}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scope & Dependency */}
          <Section title="Scope & Dependency">
            <p className="text-sm text-gray-600 max-w-3xl">
              Description of the services provided by this third party and how
              the organization depends on them operationally, financially,
              legally, or strategically.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <InfoItem label="Service Category" value="Cloud Infrastructure" />
              <InfoItem label="Geographic Scope" value="Multi-region" />
              <InfoItem label="Contract Status" value="Active" />
              <InfoItem label="Relationship Owner" value="IT Director" />
            </div>
          </Section>

          {/* Third-Party Risks */}
          <Section title="Third-Party Risks">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Risk</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Impact</th>
                  <th className="pb-2">Likelihood</th>
                  <th className="pb-2">Residual</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} className="py-4 text-gray-400 italic">
                    No third-party risks have been recorded yet.
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Assessments & Assurance */}
          <Section title="Assessments & Assurance">
            <p className="text-sm text-gray-600 max-w-3xl">
              Assessments and assurance activities performed to evaluate and
              monitor risks arising from this third-party relationship.
            </p>

            <div className="mt-4 text-sm text-gray-400 italic">
              No assessments have been completed yet.
            </div>
          </Section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Risk Decision */}
          <Section title="Risk Decision">
            <p className="text-sm text-gray-600">
              Overall risk posture and management decision for this third party.
            </p>

            <div className="mt-4 text-sm">
              <InfoItem label="Decision" value="Pending" />
              <InfoItem label="Approved By" value="—" />
              <InfoItem label="Decision Date" value="—" />
            </div>
          </Section>

          {/* Monitoring */}
          <Section title="Monitoring & Review">
            <p className="text-sm text-gray-600">
              Review cadence and monitoring triggers for this third-party
              relationship.
            </p>

            <div className="mt-4 text-sm">
              <InfoItem label="Review Frequency" value="Annual" />
              <InfoItem label="Next Review Due" value="—" />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Helper Components ---------------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function SummaryCard({
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
        <p className="text-lg font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}
