"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  standard?: string;
};

export default function AddAuditModal({ open, onClose, onCreated, standard }: Props) {
  const { show } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    audit_id: "",
    audit_name: "",
    date: "",
    lead_auditor: "",
    participants: "",
    scope: "",
    objective: "",
  });

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        status: "Scheduled", // fixed value for all new audits
        standard: standard || "iso-7101", // default to iso-7101 if not provided
      };

      await apiFetch("/audits/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      show("Audit scheduled successfully!", "success");
      onCreated();
      onClose();
      setForm({
        audit_id: "",
        audit_name: "",
        date: "",
        lead_auditor: "",
        participants: "",
        scope: "",
        objective: "",
      });
    } catch (err: any) {
      show(`Failed to schedule audit: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold">Schedule Audit</h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Audit ID</label>
              <input
                className="w-full border rounded p-2"
                value={form.audit_id}
                onChange={(e) =>
                  setForm({ ...form, audit_id: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Audit Name</label>
              <input
                className="w-full border rounded p-2"
                value={form.audit_name}
                onChange={(e) =>
                  setForm({ ...form, audit_name: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Audit Date</label>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Lead Auditor</label>
              <input
                className="w-full border rounded p-2"
                value={form.lead_auditor}
                onChange={(e) =>
                  setForm({ ...form, lead_auditor: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Participants (comma separated)
              </label>
              <input
                className="w-full border rounded p-2"
                value={form.participants}
                onChange={(e) =>
                  setForm({ ...form, participants: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Scope</label>
            <textarea
              className="w-full border rounded p-2"
              value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Objective</label>
            <textarea
              className="w-full border rounded p-2"
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Schedule Audit"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
