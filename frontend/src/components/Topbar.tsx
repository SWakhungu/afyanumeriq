// src/components/Topbar.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import NotificationsDropdown from "@/components/Notifications";
import { apiFetch } from "@/lib/api";

type Std = { code: string; name: string; path: string };

export default function Topbar() {
  const router = useRouter();
  const pathname = usePathname();

  const user = useAuthStore((s) => s.user);
  const organization = useAuthStore((s) => s.organization);
  const clearAuth = useAuthStore((s) => s.logout);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState<number | null>(null);
  const [standardsOpen, setStandardsOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const standardsRef = useRef<HTMLDivElement | null>(null);

  // Standards list
  const standards: Std[] = [
    { code: "iso-7101", name: "ISO 7101", path: "/" },
    { code: "iso-27001", name: "ISO/IEC 27001", path: "/27001" },
    { code: "iso-42001", name: "ISO/IEC 42001", path: "/42001" },
    { code: "iso-13485", name: "ISO 13485", path: "/13485" },
    { code: "iso-15189", name: "ISO 15189", path: "/15189" },
    { code: "iso-17025", name: "ISO/IEC 17025", path: "/17025" },
  ];

  // ✅ Active standard derived from current URL
  const activeStandard = useMemo(() => {
    const p = pathname || "/";
    const match = standards
      .filter((s) => (s.path === "/" ? true : p.startsWith(s.path)))
      .sort((a, b) => b.path.length - a.path.length)[0];
    return match || standards[0];
  }, [pathname]);

  // click-outside close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (standardsRef.current && !standardsRef.current.contains(e.target as Node)) {
        setStandardsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Notification count is scoped by active standard
  const refreshNotifCount = async () => {
    try {
      const resp = await apiFetch(`/notifications/?standard=${activeStandard.code}`);
      const arr = Array.isArray(resp) ? resp : resp.notifications || [];
      setNotifCount(arr.length);
    } catch {
      setNotifCount(null);
    }
  };

  useEffect(() => {
    refreshNotifCount();
    // refresh when switching standards/routes
  }, [activeStandard.code]);

  useEffect(() => {
    if (notifOpen) refreshNotifCount();
  }, [notifOpen]);

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout/", { method: "POST" });
    } catch {}
    clearAuth();
    router.push("/login");
  };

  const firstLetter =
    (user?.username || user?.first_name || "").charAt(0).toUpperCase() || "";

  return (
    <div className="flex justify-between items-center px-8 py-3 border-b bg-white select-none">
      {/* ---------- LEFT SECTION (Standards Selector) ---------- */}
      <div className="flex items-center gap-6">
        <div className="relative" ref={standardsRef}>
          <button
            onClick={() => setStandardsOpen((s) => !s)}
            className="border px-4 py-1 rounded-md flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-700"
          >
            {activeStandard.name}
            <ChevronDown className="w-4 h-4" />
          </button>

          {standardsOpen && (
            <div className="absolute mt-2 w-48 bg-white shadow-lg border rounded-lg z-50">
              {standards.map((std) => (
                <button
                  key={std.code}
                  onClick={() => {
                    setStandardsOpen(false);
                    router.push(std.path);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 ${
                    std.code === activeStandard.code ? "font-semibold bg-gray-50" : ""
                  }`}
                >
                  {std.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- RIGHT SECTION (Org, Notifs, User Menu) ---------- */}
      <div className="flex items-center gap-8">
        <span className="text-lg font-semibold text-teal-700">
          {organization?.name || ""}
        </span>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((s) => !s)}
            className="relative p-2 hover:bg-gray-100 rounded-full transition"
          >
            <Bell className="w-6 h-6 text-gray-700" />
            {notifCount !== null && notifCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow">
                {notifCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <NotificationsDropdown
              onClose={() => {
                setNotifOpen(false);
                setTimeout(() => refreshNotifCount(), 300);
              }}
            />
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((s) => !s)}
            className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-full transition"
          >
            <div className="h-9 w-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold">
              {firstLetter || "A"}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg border rounded-lg z-50">
              <Link
                href="/profile"
                className="block px-4 py-2 hover:bg-gray-100 text-gray-700"
              >
                My Profile
              </Link>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
