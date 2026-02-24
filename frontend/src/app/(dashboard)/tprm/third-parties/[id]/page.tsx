"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  CalendarClock,
  Network,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

type ThirdParty = {
  id: string;
  name: string;
  category: string;
  description?: string;
  criticality: "low" | "medium" | "high" | "critical";
  scope_of_dependency: string;
  status: "active" | "suspended" | "terminated";
  relationship_owner: number | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  review_frequency_months: number;
  next_review_due: string | null;
};

type TPRMRisk = {
  id: string;
  title: string;
  risk_type: "operational" | "security" | "financial" | "legal" | "strategic" | "reputational";
  likelihood: number;
  impact: number;
  inherent_risk_score: number;
  residual_risk_score: number | null;
  status: "open" | "mitigated" | "accepted" | "closed";
};

type TPRMAssessment = {
  id: string;
  assessment_type: "questionnaire" | "certification" | "contract_review" | "external_report" | "other";
  summary: string;
  assessment_date: string;
  valid_until: string | null;
};

type TPRMDecision = {
  id: string;
  decision: "pending" | "accept" | "mitigate" | "transfer" | "avoid";
  justification: string;
  decision_date: string | null;
};

function isOverdue(dateStr: string | null) {
  if (!dateStr) return false;
  const due = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return due.getTime() < today.getTime();
}

export default function ThirdPartyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");

  const [tp, setTp] = useState<ThirdParty | null>(null);
  const [risks, setRisks] = useState<TPRMRisk[]>([]);
  const [assessments, setAssessments] = useState<TPRMAssessment[]>([]);
  const [decision, setDecision] = useState<TPRMDecision | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const overdue = useMemo(() => isOverdue(tp?.next_review_due ?? null), [tp?.next_review_due]);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [tpData, risksData, assessData, decisionData] = await Promise.all([
          apiFetch(`/tprm/third-parties/${id}/`, { method: "GET" }),
          apiFetch(`/tprm/third-parties/${id}/risks/`, { method: "GET" }),
          apiFetch(`/tprm/third-parties/${id}/assessments/`, { method: "GET" }),
          apiFetch(`/tprm/third-parties/${id}/decision/`, { method: "GET" }),
        ]);

        if (cancelled) return;

        setTp(tpData || null);
        setRisks(Array.isArray(risksData) ? risksData : []);
        setAssessments(Array.isArray(assessData) ? assessData : []);
        setDecision(decisionData || null);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load third party profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-sm text-gray-500">Loading third party…</div>
      </div>
    );
  }

  if (error || !tp) {
    return (
      <div className="p-6 space-y-3">
        <div className="text-sm text-red-600">{error || "Third party not found."}</div>
        <button
          onClick={() => router.push("/tprm/third-parties")}
          className="text-sm text-teal-700 hover:underline inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to registry
        </button>
      </div>
    );
  }

  const activeRisks = risks.filter((r) => r.status !== "closed").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <Link
              href="/tprm/third-parties"
              className="text-sm text-teal-700 hover:underline inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back
            </Link>

            <span className="text-gray-300">/</span>

            <h1 className="text-2xl font-semibold text-gray-900 truncate">
              {tp.name}
            </h1>

            <BadgeCriticality value={tp.criticality} />

            {overdue && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium bg-amber-50 text-amber-800 border-amber-200">
                Review overdue
              </span>
            )}

            <BadgeStatus value={tp.status} />
          </div>

          <p className="text-sm text-gray-600 mt-2 max-w-4xl">
            {tp.description?.trim()
              ? tp.description
              : "Third party profile, associated risks, assessments and management decisions."}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Criticality"
          value={cap(tp.criticality)}
          icon={<AlertTriangle size={18} className="text-amber-700" />}
        />
        <SummaryCard
          title="Active Risks"
          value={String(activeRisks)}
          icon={<Network size={18} className="text-teal-700" />}
        />
        <SummaryCard
          title="Last Assessment"
          value={assessments[0]?.assessment_date ?? "—"}
          icon={<ClipboardCheck size={18} className="text-blue-700" />}
        />
        <SummaryCard
          title="Next Review"
          value={tp.next_review_due ?? "—"}
          icon={<CalendarClock size={18} className="text-purple-700" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scope & Dependency */}
          <Section title="Scope & Dependency">
            <p className="text-sm text-gray-600 max-w-4xl">
              {tp.scope_of_dependency}
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <InfoItem label="Category" value={tp.category || "—"} />
              <InfoItem label="Review Frequency" value={`${tp.review_frequency_months} months`} />
              <InfoItem label="Contract Start" value={tp.contract_start_date ?? "—"} />
              <InfoItem label="Contract End" value={tp.contract_end_date ?? "—"} />
            </div>
          </Section>

          {/* Third-Party Risks */}
          <Section title="Third-Party Risks">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Risk</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">L</th>
                    <th className="pb-2">I</th>
                    <th className="pb-2">Inherent</th>
                    <th className="pb-2">Residual</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {risks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-4 text-gray-400 italic">
                        No third-party risks have been recorded yet.
                      </td>
                    </tr>
                  ) : (
                    risks.map((r) => (
                      <tr key={r.id} className="border-b last:border-b-0">
                        <td className="py-3 font-medium text-gray-900">{r.title}</td>
                        <td className="py-3 text-gray-700">{cap(r.risk_type)}</td>
                        <td className="py-3 text-gray-700">{r.likelihood}</td>
                        <td className="py-3 text-gray-700">{r.impact}</td>
                        <td className="py-3 text-gray-900 font-medium">{r.inherent_risk_score}</td>
                        <td className="py-3 text-gray-700">{r.residual_risk_score ?? "—"}</td>
                        <td className="py-3">
                          <BadgeRiskStatus value={r.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Assessments & Assurance */}
          <Section title="Assessments & Assurance">
            {assessments.length === 0 ? (
              <div className="text-sm text-gray-400 italic">
                No assessments have been completed yet.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {assessments.map((a) => (
                  <li key={a.id} className="py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900">
                          {cap(a.assessment_type.replace("_", " "))}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Date: {a.assessment_date} {a.valid_until ? `• Valid until: ${a.valid_until}` : ""}
                        </div>
                        <p className="text-sm text-gray-600 mt-2 max-w-4xl">
                          {a.summary}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* Risk Decision */}
          <Section title="Risk Decision">
            <p className="text-sm text-gray-600">
              Overall management decision for this third-party relationship.
            </p>

            <div className="mt-4 text-sm space-y-3">
              <InfoItem label="Decision" value={decision ? cap(decision.decision) : "—"} />
              <InfoItem label="Decision Date" value={decision?.decision_date ?? "—"} />
              <InfoItem label="Justification" value={decision?.justification?.trim() ? decision.justification : "—"} />
            </div>
          </Section>

          {/* Monitoring & Review */}
          <Section title="Monitoring & Review">
            <p className="text-sm text-gray-600">
              Review cadence and monitoring triggers for this relationship.
            </p>

            <div className="mt-4 text-sm space-y-3">
              <InfoItem label="Review Frequency" value={`${tp.review_frequency_months} months`} />
              <InfoItem label="Next Review Due" value={tp.next_review_due ?? "—"} />
              <InfoItem label="Status" value={cap(tp.status)} />
            </div>
          </Section>

          {/* Notes */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
            <p className="flex items-start gap-2 max-w-4xl">
              <FileText size={18} className="text-teal-700 mt-0.5" />
              Keep evidence and assurance artifacts (e.g., contracts, reports, certificates)
              attached to assessments for strong audit trails.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI helpers ---------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
        <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-900 break-words">{value}</p>
    </div>
  );
}

function BadgeCriticality({ value }: { value: "low" | "medium" | "high" | "critical" }) {
  const cls =
    value === "critical"
      ? "bg-red-50 text-red-700 border-red-200"
      : value === "high"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : value === "medium"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${cls}`}>
      {cap(value)}
    </span>
  );
}

function BadgeStatus({ value }: { value: "active" | "suspended" | "terminated" }) {
  const cls =
    value === "active"
      ? "bg-green-50 text-green-700 border-green-200"
      : value === "suspended"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${cls}`}>
      {cap(value)}
    </span>
  );
}

function BadgeRiskStatus({ value }: { value: "open" | "mitigated" | "accepted" | "closed" }) {
  const cls =
    value === "open"
      ? "bg-red-50 text-red-700 border-red-200"
      : value === "mitigated"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : value === "accepted"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-green-50 text-green-700 border-green-200";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${cls}`}>
      {cap(value)}
    </span>
  );
}

function cap(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
