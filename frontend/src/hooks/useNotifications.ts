"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export type NotificationItem = {
  id?: number;
  message: string;
  type: "risk" | "audit" | "compliance" | "finding";
  severity?: "alert" | "warning" | "info";
};

export default function useNotifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        console.log("🔔 Fetching notifications...");
        const data = await apiFetch("/notifications/");
        console.log("🔔 Response received:", data);

        const notifications = data.notifications || [];
        console.log(`🔔 Total notifications: ${notifications.length}`);

        // Filter to show only alerts and warnings (overdue/urgent items)
        const filtered = notifications.filter(
          (n: any) => n.severity === "alert" || n.severity === "warning"
        );

        console.log(`🔔 Filtered to alerts/warnings: ${filtered.length}`);
        setItems(filtered);
      } catch (err) {
        console.error("🔔 Failed loading notifications:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    load();
    // Refresh every 30 seconds
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return { items, loading };
}
