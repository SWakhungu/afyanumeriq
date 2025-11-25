// src/app/(dashboard)/layout.tsx
"use client";

import Sidebar from "@/components/sidebar";
import { useEffect, useRef, useState } from "react";
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
        // Not fatal — maybe user is not authenticated yet or token expired.
        console.log("Failed to load org on dashboard init:", err);
      }
    };
    loadOrg();
    return () => {
      mounted = false;
    };
  }, [setOrganization]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar fixed */}
      <Sidebar />

      {/* Main panel - THIS MUST SCROLL */}
      <div className="flex-1 flex flex-col overflow-y-auto max-h-screen">
        {/* Use the real Top bar */}
        <div className="sticky top-0 z-20 bg-white shadow-sm px-6 py-4 flex items-center justify-end">
          <Topbar />
        </div>

        {/* Main scrolling content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
