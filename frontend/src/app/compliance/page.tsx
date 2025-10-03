"use client";

import { useState, useMemo } from "react";

/**
 * Compliance Tracker (34 subclauses for ISO 7101:2023)
 * - No external chart deps (simple SVG donut)
 * - One evidence file per clause (stored in browser memory via Object URL)
 * - Status options: NI, P, IP, MI, O
 *
 * IMPORTANT: This file implements the exact 34 parent subclauses:
 *  4.1 - 4.4 (4)
 *  5.1 - 5.5 (5)
 *  6.1 - 6.3 (3)
 *  7.1 - 7.5 (5)  (7.5 consolidates the documentation items you provided)
 *  8.1 - 8.12 (12)
 *  9.1 - 9.3 (3)  (9.1 consolidates the monitoring/indicators points)
 * 10.1 - 10.2 (2)
 *
 * The requirement text for each parent subclause includes the detail points you provided.
 */

type Evidence = {
  name: string;
  url: string;
};

type Clause = {
  id: string;
  requirement: string;
  status: "NI" | "P" | "IP" | "MI" | "O";
  comments: string;
  evidence?: Evidence | null;
};

const STATUS_OPTIONS: Clause["status"][] = ["NI", "P", "IP", "MI", "O"];

const STATUS_WEIGHT: Record<Clause["status"], number> = {
  NI: 0,
  P: 25,
  IP: 50,
  MI: 75,
  O: 100,
};

function statusClasses(s: Clause["status"]) {
  switch (s) {
    case "NI":
      return "bg-red-600 text-white";
    case "P":
      return "bg-orange-500 text-white";
    case "IP":
      return "bg-yellow-400 text-black";
    case "MI":
      return "bg-blue-600 text-white";
    case "O":
      return "bg-green-600 text-white";
    default:
      return "bg-gray-200";
  }
}

/* --- The 34 subclauses (IDs + requirement text derived exactly from user's input) --- */
const INITIAL_CLAUSES: Clause[] = [
  // Clause 4 — Context (4)
  {
    id: "4.1",
    requirement:
      "Identified the external and internal issues that affect the organization and the healthcare quality management system.",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "4.2",
    requirement:
      "Clear understanding of the needs and expectations of interested parties.",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "4.3",
    requirement:
      "The scope of the management system for quality is clearly determined.",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "4.4",
    requirement:
      "The MS (management system) for quality is built and maintained in its entirety.",
    status: "NI",
    comments: "",
    evidence: null,
  },

  // Clause 5 — Leadership (5)
  {
    id: "5.1",
    requirement:
      "Ensuring that the MS for quality supports continual improvement.",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "5.2",
    requirement:
      "The documented Healthcare Quality Policy containing the healthcare objectives is relevant to the organization.",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "5.3",
    requirement:
      "Responsibilities and levels of authority for individuals responsible for the HQMS must be understood.",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "5.4",
    requirement:
      "Service user focus — Has management ensured service users' rights are clearly known?",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "5.5",
    requirement:
      "The healthcare organization ensures access to care in accordance with its defined mandate and applicable laws and regulations.",
    status: "NI",
    comments: "",
    evidence: null,
  },

  // Clause 6 — Planning (3: 6.1, 6.2, 6.3). We consolidate the 6.1.* details into 6.1
  {
    id: "6.1",
    requirement:
      "Actions to address risks and opportunities (includes: documenting risks and opportunities from context & interested parties, shared risk culture, and documented system to identify risks/opportunities).",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "6.2",
    requirement: "The healthcare quality objectives and plans to achieve them.",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "6.3",
    requirement:
      "Changes to the HQMS are determined and managed in a planned manner.",
    status: "NI",
    comments: "",
    evidence: null,
  },

  // Clause 7 — Support (5: 7.1..7.5; 7.5 consolidates 7.5.1..7.5.6)
  {
    id: "7.1",
    requirement:
      "The organization has determined and provided the resources (people, budget, infrastructure) required for the HQMS.",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "7.2",
    requirement: "Individuals are competent, and records are kept as evidence.",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "7.3",
    requirement:
      "Individuals are aware of the HQMS, the objectives applicable to their roles, and their contribution to the HQMS.",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "7.4",
    requirement:
      "The organization must determine what to communicate about the HQMS internally and externally.",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "7.5",
    requirement:
      "Documented information: consideration of level of documentation, creation/updating, controls (title/date/author/ref), protection of information systems, electronic info control, and definition of clinical vs non-clinical records.",
    status: "NI",
    comments: "",
    evidence: null,
  },

  // Clause 8 — Operation (12: 8.1..8.12)
  {
    id: "8.1",
    requirement:
      "Maintain processes to run the HQMS and implement actions identified in Clause 6.",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "8.2",
    requirement:
      "Healthcare facilities management and maintenance; contingencies for facilities and services; proper use and safety of equipment.",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "8.3",
    requirement:
      "Waste management, waste reduction planning, and environmental responsibility.",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "8.4",
    requirement: "Responsible handling and storage of materials.",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "8.5",
    requirement: "Service user belongings (processes to manage/return items).",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "8.6",
    requirement: "Consideration and safe adoption of emerging technologies.",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "8.7",
    requirement: "Service design taking a user-centric approach.",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "8.8",
    requirement:
      "Ensure that clinical and non-clinical externally provided products and services conform to organizational requirements.",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "8.9",
    requirement: "Provision of services (delivery and management of services).",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "8.10",
    requirement:
      "People-centred care: inclusivity, diversity, health literacy, service user experience and assessment, compassionate care, cultural competence training, health literacy for workforce/service users, co-production, and workforce wellbeing.",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "8.11",
    requirement:
      "Ethics — healthcare provision done competently and morally, with respect for individuals.",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "8.12",
    requirement:
      "Patient safety cluster (patient safety culture; identification processes; medication management; surgical safety; IPC program; prevention of falls, pressure ulcers, thromboembolism; diagnostic safety; blood transfusion safety).",
    status: "NI",
    comments: "",
    evidence: null,
  },

  // Clause 9 — Performance evaluation (3: 9.1..9.3) — 9.1 consolidates 9.1.* items
  {
    id: "9.1",
    requirement:
      "Monitoring, measurement, analysis and evaluation of the HQMS, including healthcare quality indicators, methods, and use of results to inform strategic quality directions.",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "9.2",
    requirement:
      "Internal audit and internal audit programme to verify conformity and performance of the HQMS.",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "9.3",
    requirement:
      "Management review (inputs, outputs and use of results to drive improvement).",
    status: "NI",
    comments: "",
    evidence: null,
  },

  // Clause 10 — Improvement (2)
  {
    id: "10.1",
    requirement: "Continual improvement of the HQMS.",
    status: "NI",
    comments: "",
    evidence: null,
  },
  {
    id: "10.2",
    requirement:
      "Nonconformity & corrective action and management of nonconformity and corrective action.",
    status: "NI",
    comments: "",
    evidence: null,
  },
];

export default function CompliancePage() {
  const [clauses, setClauses] = useState<Clause[]>(INITIAL_CLAUSES);

  // calculate compliance % as weighted average of statuses
  const compliancePercent = useMemo(() => {
    if (clauses.length === 0) return 0;
    const sum = clauses.reduce((acc, c) => acc + STATUS_WEIGHT[c.status], 0);
    return sum / clauses.length;
  }, [clauses]);

  // simple SVG donut details
  const donutSize = 160;
  const stroke = 18;
  const radius = (donutSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (compliancePercent / 100) * circumference;

  const updateField = (index: number, field: keyof Clause, value: any) => {
    const copy = [...clauses];
    (copy[index] as any)[field] = value;
    setClauses(copy);
  };

  const handleFileChange = (index: number, file?: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateField(index, "evidence", { name: file.name, url });
  };

  const removeEvidence = (index: number) => {
    updateField(index, "evidence", null);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Compliance Tracker — ISO 7101:2023
      </h1>

      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-4">
          {/* Donut (SVG) */}
          <svg
            width={donutSize}
            height={donutSize}
            viewBox={`0 0 ${donutSize} ${donutSize}`}
          >
            <g transform={`translate(${donutSize / 2}, ${donutSize / 2})`}>
              {/* Background circle */}
              <circle
                r={radius}
                fill="transparent"
                stroke="#e5e7eb"
                strokeWidth={stroke}
                strokeLinecap="round"
              />
              {/* Foreground arc (compliance) */}
              <circle
                r={radius}
                fill="transparent"
                stroke="#14b8a6"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${filled} ${circumference - filled}`}
                transform={`rotate(-90)`}
              />
            </g>
          </svg>

          <div>
            <div className="text-xl font-semibold">
              {compliancePercent.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">
              Overall compliance score
            </div>
            <div className="mt-2 text-sm text-gray-600">
              (Weighted by status: NI=0, P=25, IP=50, MI=75, O=100)
            </div>
          </div>
        </div>

        <div className="ml-auto">
          <div className="p-3 bg-white border rounded shadow-sm">
            <div className="text-sm text-gray-600">Clauses</div>
            <div className="text-lg font-semibold">{clauses.length}</div>
          </div>
        </div>
      </div>

      {/* Table with sticky header, Evidence column included */}
      <div className="overflow-x-auto">
        <div className="max-h-[560px] overflow-y-auto border rounded">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="p-2 border">Clause</th>
                <th className="p-2 border">Requirement</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Comments</th>
                <th className="p-2 border">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {clauses.map((c, i) => (
                <tr key={c.id} className="hover:bg-gray-50 align-top">
                  <td className="p-2 border font-semibold align-top">{c.id}</td>
                  <td className="p-2 border align-top">
                    <div className="whitespace-normal">{c.requirement}</div>
                  </td>

                  <td className="p-2 border align-top">
                    <select
                      value={c.status}
                      onChange={(e) =>
                        updateField(
                          i,
                          "status",
                          e.target.value as Clause["status"]
                        )
                      }
                      className={`px-2 py-1 rounded ${statusClasses(c.status)}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-2 border align-top">
                    <input
                      type="text"
                      value={c.comments}
                      onChange={(e) =>
                        updateField(i, "comments", e.target.value)
                      }
                      className="w-full border rounded px-2 py-1"
                      placeholder="Comments / gap analysis notes"
                    />
                  </td>

                  <td className="p-2 border align-top">
                    {c.evidence ? (
                      <div className="flex flex-col gap-2">
                        <a
                          href={c.evidence.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-600 underline text-sm"
                        >
                          {c.evidence.name}
                        </a>
                        <div className="flex gap-2">
                          <button
                            className="text-sm px-2 py-1 bg-gray-100 rounded"
                            onClick={() => removeEvidence(i)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            type="file"
                            onChange={(ev) => {
                              const file = ev.target.files?.[0] ?? null;
                              if (file) handleFileChange(i, file);
                              // reset input value so same file can be re-added later if needed
                              ev.currentTarget.value = "";
                            }}
                            className="text-sm"
                          />
                        </label>
                        <div className="text-xs text-gray-500 mt-1">
                          Upload evidence (PDF, image, doc)
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Notes:
        <ul className="list-disc ml-6">
          <li>
            Files are stored in-browser (temporary object URLs). When you
            connect a backend, these inputs should upload to the server/S3 and
            the returned file URL saved on the clause record.
          </li>
          <li>
            Statuses update the compliance % live; saved locally in the frontend
            state for now.
          </li>
        </ul>
      </div>
      {/* Status Legend */}
      <div className="mt-8 p-4 border rounded bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Status Key</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <span className="inline-block px-2 py-1 rounded bg-red-600 text-white font-semibold mr-2">
              NI
            </span>{" "}
            (Not Implemented) — There is no evidence of implementation of formal
            processes or activities nor their achievement.
          </li>
          <li>
            <span className="inline-block px-2 py-1 rounded bg-orange-500 text-white font-semibold mr-2">
              P
            </span>{" "}
            (Planned) — Formal processes and activities have been designed and
            are in the early stages of implementation.
          </li>
          <li>
            <span className="inline-block px-2 py-1 rounded bg-yellow-400 text-black font-semibold mr-2">
              IP
            </span>{" "}
            (In Progress) — The processes and activities have been partially
            implemented, but are not yet fully functional or effective in the
            organization.
          </li>
          <li>
            <span className="inline-block px-2 py-1 rounded bg-blue-600 text-white font-semibold mr-2">
              MI
            </span>{" "}
            (Mostly Implemented) — The processes and activities are fully or
            mostly in use, but lack structured oversight and continual
            improvement.
          </li>
          <li>
            <span className="inline-block px-2 py-1 rounded bg-green-600 text-white font-semibold mr-2">
              O
            </span>{" "}
            (Optimized) — The processes and activities are fully implemented,
            consistently used, and actively managed for continual improvement;
            relevant people are also formally trained.
          </li>
        </ul>
      </div>
    </div>
  );
}
