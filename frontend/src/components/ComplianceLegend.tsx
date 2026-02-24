"use client";

import { useState } from "react";
import {
  STATUSES,
  STATUS_LABELS,
  STATUS_DESCRIPTIONS,
  STATUS_BADGE_CLASS,
} from "@/lib/statusRules";

type Props = {
  className?: string;
};

export default function ComplianceLegend({ className }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm underline text-gray-600 hover:text-black"
      >
        {open ? "Hide status legend" : "Show status legend"}
      </button>

      {open && (
        <div className="mt-2 p-3 border rounded-md bg-gray-50 shadow-sm space-y-3 text-sm w-72">
          {STATUSES.map((status) => (
            <div key={status} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs ${STATUS_BADGE_CLASS[status]}`}>
                  {status}
                </span>
                <span className="font-medium">{STATUS_LABELS[status]}</span>
              </div>
              <p className="text-gray-600 ml-7">{STATUS_DESCRIPTIONS[status]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
