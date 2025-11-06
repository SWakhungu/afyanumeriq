"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Clause = {
  id: number;
  clause_number: string;
  short_description: string;
  description: string;
  status: "NI" | "P" | "IP" | "MI" | "O";
  owner: string;
  comments?: string | null;
  evidence?: string | null;
  last_updated: string;
};

export default function ClauseDrawer({
  open,
  onClose,
  clause,
}: {
  open: boolean;
  onClose: () => void;
  clause: Clause | null;
}) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  if (!open || !clause) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close drawer overlay"
      />
      {/* drawer panel */}
      <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white shadow-xl p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            Clause {clause.clause_number}
          </h2>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Badge
            variant={
              clause.status === "O"
                ? "default"
                : clause.status === "MI"
                ? "success"
                : clause.status === "IP"
                ? "warning"
                : clause.status === "P"
                ? "secondary"
                : "destructive"
            }
          >
            {clause.status}
          </Badge>
          <span className="text-xs text-gray-500">
            Last updated: {new Date(clause.last_updated).toLocaleString()}
          </span>
        </div>

        <Card className="p-3 mb-4">
          <div className="text-sm text-gray-500 mb-1">Short summary</div>
          <div className="text-gray-800">{clause.short_description}</div>
        </Card>

        <Card className="p-3 mb-4">
          <div className="text-sm text-gray-500 mb-1">Full official text</div>
          <div className="text-gray-800 whitespace-pre-wrap">
            {clause.description}
          </div>
        </Card>

        <Card className="p-3 mb-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-500">Owner</div>
              <div className="font-medium">{clause.owner || "Unassigned"}</div>
            </div>
            <div>
              <div className="text-gray-500">Evidence</div>
              <div className="font-medium">
                {clause.evidence ? "Stored" : "None"}
              </div>
            </div>
          </div>
        </Card>

        {clause.comments && (
          <Card className="p-3">
            <div className="text-sm text-gray-500 mb-1">Comments</div>
            <div className="text-gray-800 whitespace-pre-wrap">
              {clause.comments}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
