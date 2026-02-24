// src/app/(dashboard)/layout.tsx
"use client";

import Sidebar from "@/components/sidebar";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import Topbar from "@/components/Topbar";
import { apiFetch } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setOrganization } = useAuthStore();

  // Load organization on dashboard init
  useEffect(() => {
    let mounted = true;

    const loadOrg = async () => {
      try {
        const org = await apiFetch("/settings/organization/");
        if (mounted && org && org.name) {
          setOrganization(org);
        }
      } catch (err) {
        console.log("Failed to load org on dashboard init:", err);
      }
    };

    loadOrg();
    return () => {
      mounted = false;
    };
  }, [setOrganization]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-y-auto max-h-screen">

        {/* Topbar FIXED: allow Topbar to control its own layout */}
        <div className="sticky top-0 z-20 bg-white shadow-sm">
          <Topbar />
        </div>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
