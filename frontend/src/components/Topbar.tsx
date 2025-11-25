// src/components/Topbar.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import NotificationsDropdown from "@/components/Notifications";
import { apiFetch } from "@/lib/api";

export default function Topbar() {
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const organization = useAuthStore((s) => s.organization);
  const clearAuth = useAuthStore((s) => s.logout);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState<number | null>(null);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Try to fetch lightweight notifications count (best-effort)
  const refreshNotifCount = async () => {
    try {
      const resp = await apiFetch("/notifications/");
      const arr = Array.isArray(resp) ? resp : resp.notifications || [];
      setNotifCount(arr.length);
    } catch (err) {
      // 401 or other errors are normal if not logged in; ignore
      setNotifCount(null);
    }
  };

  useEffect(() => {
    // initial try
    refreshNotifCount();
  }, []);

  // When dropdown is opened refresh the count & let the dropdown perform full fetch
  useEffect(() => {
    if (notifOpen) refreshNotifCount();
  }, [notifOpen]);

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout/", { method: "POST" });
    } catch (e) {
      console.warn("Logout API failed, clearing local session anyway");
    }
    clearAuth();
    router.push("/login");
  };

  const firstLetter = (user?.username || user?.first_name || "")
    .charAt(0)
    .toUpperCase() || "";

  return (
    <div className="flex justify-end items-center px-8 py-3 border-b bg-white select-none">
      <div className="flex items-center gap-8">
        {/* Organization Name */}
        <span className="text-lg font-semibold text-teal-700">
          {organization?.name || ""}
        </span>

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((s) => !s)}
            className="relative p-2 hover:bg-gray-100 rounded-full transition"
          >
            <Bell className="w-6 h-6 text-gray-700" />
            {notifCount && notifCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow">
                {notifCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <NotificationsDropdown
              onClose={() => {
                setNotifOpen(false);
                // refresh count after user may have read items
                setTimeout(() => refreshNotifCount(), 300);
              }}
            />
          )}
        </div>

        {/* User dropdown */}
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
