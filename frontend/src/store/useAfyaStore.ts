import { create } from "zustand";

type Risk = {
  id: number;
  description: string;
  likelihood: string;
  impact: string;
  riskScore: number;
  riskLevel: string;
  existingControl: string;
  treatmentAction: string;
  owner: string;
  status: string;
  reviewDate: string;
};

type Audit = {
  id: number;
  name: string;
  date: string;
  status: string;
};

type Finding = {
  id: number;
  auditId: number;
  description: string;
  severity: string;
  correctiveAction: string;
  dueDate: string;
  status: string;
};

type ComplianceItem = {
  id: number;
  clause: string;
  description: string;
  status: string;
  evidence: string;
};

interface AfyaStore {
  risks: Risk[];
  audits: Audit[];
  complianceRecords: ComplianceItem[];
  findings: Finding[];
  addRisk: (risk: Risk) => void;
  addAudit: (audit: Audit) => void;
  addCompliance: (record: ComplianceItem) => void;
  addFinding: (finding: Finding) => void;
  updateRiskStatus: (id: number, status: string) => void;
}

export const useAfyaStore = create<AfyaStore>((set) => ({
  // Sample initial data
  risks: [
    {
      id: 1,
      description: "Equipment calibration delays",
      likelihood: "Medium",
      impact: "High",
      riskScore: 12,
      riskLevel: "High",
      existingControl: "Monthly equipment checks",
      treatmentAction: "Introduce weekly calibration review",
      owner: "Head of Clinical Engineering",
      status: "Open",
      reviewDate: "2025-11-15",
    },
  ],
  audits: [
    {
      id: 1,
      name: "Internal Quality Audit Q4",
      date: "2025-11-01",
      status: "Scheduled",
    },
  ],
  complianceRecords: [
    {
      id: 1,
      clause: "4.1",
      description: "Identified external and internal issues that affect HQMS.",
      status: "IP",
      evidence: "",
    },
  ],
  findings: [
    {
      id: 1,
      auditId: 1,
      description: "Untrained staff handling medical devices.",
      severity: "Major",
      correctiveAction: "Schedule refresher training",
      dueDate: "2025-10-20",
      status: "Open",
    },
  ],
  // Actions
  addRisk: (risk) => set((state) => ({ risks: [...state.risks, risk] })),
  addAudit: (audit) => set((state) => ({ audits: [...state.audits, audit] })),
  addCompliance: (record) =>
    set((state) => ({
      complianceRecords: [...state.complianceRecords, record],
    })),
  addFinding: (finding) =>
    set((state) => ({ findings: [...state.findings, finding] })),
  updateRiskStatus: (id, status) =>
    set((state) => ({
      risks: state.risks.map((r) => (r.id === id ? { ...r, status } : r)),
    })),
}));
