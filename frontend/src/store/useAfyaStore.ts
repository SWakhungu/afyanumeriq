import { create } from "zustand";
import { apiFetch } from "@/lib/api";

//
// 🧩 Type Definitions
//
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
  updateComplianceStatus: (id: number, status: string) => void;
  updateAuditStatus: (id: number, status: string) => void;

  // --- Async Fetch Methods (Backend Integration) ---
  fetchRisks: () => Promise<void>;
  fetchAudits: () => Promise<void>;
  fetchCompliance: () => Promise<void>;
  fetchFindings: () => Promise<void>;
  fetchTasks: () => Promise<void>;
}

//
// 🏥 Zustand Store Definition
//
export const useAfyaStore = create<AfyaStore>((set) => ({
  // --- Initial Data ---
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
    {
      id: 2,
      name: "Patient Safety Review",
      date: "2025-12-05",
      status: "Planned",
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
    {
      id: 2,
      clause: "5.1",
      description: "Ensuring the HQMS supports continual improvement.",
      status: "MI",
      evidence: "",
    },
  ],

  findings: [
    {
      id: 1,
      auditId: 1,
      description: "Untrained staff handling medical devices.",
      severity: "Major",
      correctiveAction: "Schedule device handling refresher course",
      dueDate: "2025-10-20",
      status: "Open",
    },
  ],

  // --- Setter Functions ---
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

  updateComplianceStatus: (id, status) =>
    set((state) => ({
      complianceRecords: state.complianceRecords.map((r) =>
        r.id === id ? { ...r, status } : r
      ),
    })),

  updateAuditStatus: (id, status) =>
    set((state) => ({
      audits: state.audits.map((a) => (a.id === id ? { ...a, status } : a)),
    })),

  // --- Async Fetch Methods (Backend Integration) ---
  fetchRisks: async () => {
    const data = await apiFetch("/api/risks/");
    set({ risks: data });
  },
  fetchAudits: async () => {
    const data = await apiFetch("/api/audits/");
    set({ audits: data });
  },
  fetchCompliance: async () => {
    const data = await apiFetch("/api/compliance/");
    set({ complianceRecords: data });
  },
  fetchFindings: async () => {
    const data = await apiFetch("/api/findings/");
    set({ findings: data });
  },
  fetchTasks: async () => {
    const data = await apiFetch("/api/tasks/");
    set({ tasks: data });
  },
}));
