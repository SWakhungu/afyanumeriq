"use client";

import { create } from "zustand";

export type ComplianceItem = {
  id: number;
  clause_number: string;
  short_description: string;
  description: string;
  status: "NI" | "P" | "IP" | "MI" | "O";
  owner: string;
  comments: string | null;
  evidence: string | null;
  last_updated: string;
};

export type RiskItem = {
  id: number;
  risk_id: string;
  description: string;
  likelihood: number;
  impact: number;
  risk_score: number;
  risk_level: string;
  status: string;
  owner: string;
  review_date: string;
};

export type AuditItem = {
  id: number;
  audit_id: string;
  audit_name: string;
  status: string;
  date: string;
};

type AfyaState = {
  risks: RiskItem[];
  audits: AuditItem[];
  complianceRecords: ComplianceItem[];

  setRisks: (data: RiskItem[]) => void;
  setAudits: (data: AuditItem[]) => void;
  setComplianceRecords: (data: ComplianceItem[]) => void;
};

export const useAfyaStore = create<AfyaState>((set) => ({
  risks: [],
  audits: [],
  complianceRecords: [], // ✅ now empty by default, no fake data

  setRisks: (data) => set({ risks: data }),
  setAudits: (data) => set({ audits: data }),
  setComplianceRecords: (data) => set({ complianceRecords: data }),
}));
