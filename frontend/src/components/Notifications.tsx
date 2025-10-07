"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useAfyaStore } from "@/store/useAfyaStore";

export default function Notifications() {
  const [open, setOpen] = useState(false);
  const risks = useAfyaStore((s) => s.risks ?? []);
  const compliance = useAfyaStore((s) => s.complianceRecords ?? []);
  const audits = useAfyaStore((s) => s.audits ?? []);

  const notifications: { id: number; message: string; type: string }[] = [];
  let id = 1;

  // Risk Alerts
  risks.forEach((r) => {
    if (r.status === "Open") {
      notifications.push({
        id: id++,
        message: `Risk "${r.description}" remains open.`,
        type: "alert",
      });
    }
  });

  // Pending Compliance
  compliance.forEach((c) => {
    if (["NI", "P", "IP"].includes(c.status)) {
      notifications.push({
        id: id++,
        message: `Clause ${c.id} (${c.status}) requires attention.`,
        type: "info",
      });
    }
  });

  // Upcoming Audits
  audits.forEach((a) => {
    if (a.status !== "Completed") {
      notifications.push({
        id: id++,
        message: `Audit "${a.name}" is pending completion.`,
        type: "warning",
      });
    }
  });

  const count = notifications.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full bg-white shadow hover:bg-gray-100"
      >
        <Bell className="h-6 w-6 text-gray-700" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
          <div className="p-3 font-semibold border-b text-gray-700">
            Notifications
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-3 text-gray-500 text-sm">
                ✅ All systems healthy.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 border-b text-sm ${
                    n.type === "warning"
                      ? "bg-yellow-50 border-yellow-200"
                      : n.type === "alert"
                      ? "bg-red-50 border-red-200"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  {n.message}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
