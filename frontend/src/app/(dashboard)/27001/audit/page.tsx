"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AddAuditModal from "@/app/(dashboard)/audit/AddAuditModal";
import Link from "next/link";

type Audit = {
  id: number;
  audit_name: string;
  date: string;
  status: "Scheduled" | "In Progress" | "Completed";
  lead_auditor: string;
};

export default function ISO27001Audit() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [open, setOpen] = useState(false);

  const loadAudits = async () => {
    const data = await apiFetch("/audits/?standard=iso-27001");
    setAudits(data);
  };

  useEffect(() => {
    loadAudits();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">ISO/IEC 27001 — Audits</h1>
        <Button onClick={() => setOpen(true)}>Schedule Audit</Button>
      </div>

      {audits.length === 0 ? (
        <p className="text-gray-500 italic">No ISO 27001 audits scheduled.</p>
      ) : (
        <div className="space-y-4">
          {audits.map((a) => (
            <Card key={a.id} className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{a.audit_name}</h3>
                <p className="text-sm text-gray-600">
                  Lead: {a.lead_auditor} | Date:{" "}
                  {new Date(a.date).toLocaleDateString()}
                </p>
                <p className="mt-2">
                  <strong>Scope:</strong> {a.scope}
                </p>
                <p>
                  <strong>Participants:</strong> {a.participants}
                </p>
                <p>
                  <strong>Objective:</strong> {a.objective}
                </p>
                <Link href={`/27001/audit/findings?audit_id=${a.id}`}>
                  <Button className="mt-2" variant="outline" size="sm">
                    View Findings
                  </Button>
                </Link>
              </div>
              <Badge>{a.status}</Badge>
            </Card>
          ))}
        </div>
      )}

      <AddAuditModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={loadAudits}
        standard="iso-27001"
      />
    </div>
  );
}
