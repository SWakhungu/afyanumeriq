// src/components/Notifications.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";

type NotificationItem = {
  id: number;
  type: string;
  severity: string;
  message: string;
  link?: string;
  standard?: string;
};

export default function NotificationsDropdown({
  onClose,
}: {
  onClose?: () => void;
}) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Derive active standard from pathname (same logic as Topbar)
  const activeStandard = useMemo(() => {
    const standards = [
      { code: "selector", path: "/" },
      { code: "iso-7101", path: "/7101" },
      { code: "iso-27001", path: "/27001" },
      { code: "iso-42001", path: "/42001" },
      { code: "iso-13485", path: "/13485" },
      { code: "iso-15189", path: "/15189" },
      { code: "iso-17025", path: "/17025" },
    ];

    const p = pathname || "/";
    const realStandards = standards.filter((s) => s.path !== "/");
    const match = realStandards
      .filter((s) => p === s.path || p.startsWith(`${s.path}/`))
      .sort((a, b) => b.path.length - a.path.length)[0];

    return (match || standards[0]).code;
  }, [pathname]);

  // fetch notifications once when component mounts
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const std = activeStandard === "selector" ? "iso-7101" : activeStandard;
        const data = await apiFetch(`/notifications/?standard=${std}`);
        // backend historically returned either array or {notifications: [...]}
        const arr = Array.isArray(data) ? data : data.notifications || [];
        if (mounted) setItems(arr);
        console.log("🔔 Notifications API response:", arr.length, "items");
      } catch (err) {
        console.error("Failed to load notifications:", err);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [activeStandard]);

  // close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose?.();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleClickNotification = async (n: NotificationItem) => {
    // optimistic UX: remove item locally (mark as read locally)
    setItems((prev) => prev.filter((i) => i.id !== n.id));

    // best effort: call backend mark-read endpoint if exists (swallow errors)
    try {
      // this endpoint may not exist on backend; if it does, it will mark read.
      await apiFetch(`/notifications/${n.id}/mark-read/`, {
        method: "POST",
      }).catch(() => {});
    } catch {}

    // navigate
    const link = n.link || "";
    const route = link.startsWith("/") ? link : `/${link}`; // safe default
    try {
      router.push(route);
    } catch (err) {
      console.warn("Failed to navigate to notification link:", route, err);
    } finally {
      onClose?.();
    }
  };

  const count = items.length;

  return (
    <div
      className="absolute right-0 mt-2 w-96 bg-white shadow-lg border rounded-lg overflow-hidden z-50"
      ref={dropdownRef}
    >
      <div className="p-4 text-gray-700 font-medium border-b">
        Notifications
      </div>

      <div className="max-h-96 overflow-auto">
        {loading ? (
          <div className="p-4 text-sm text-gray-500">Loading...</div>
        ) : count === 0 ? (
          <div className="p-4 text-sm text-gray-500">No notifications</div>
        ) : (
          items.map((n) => (
            <div
              key={n.id}
              onClick={() => handleClickNotification(n)}
              className="p-3 border-b hover:bg-gray-50 cursor-pointer"
            >
              <div className="text-sm font-semibold capitalize">{n.type}</div>
              <div className="text-sm text-gray-700">{n.message}</div>
            </div>
          ))
        )}
      </div>

      <div className="p-2 text-xs text-gray-500 text-center border-t">
        {count} notification{count !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
