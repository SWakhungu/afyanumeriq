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
      description:
        "Identified external and internal issues that affect the organization and HQMS.",
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
}));
