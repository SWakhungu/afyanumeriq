"use client";

import { useAfyaStore } from "@/store/useAfyaStore";
import { useState, useRef, useEffect } from "react";

export default function Topbar() {
  const [showNotifications, setShowNotifications] = useState(false);
  const { risks } = useAfyaStore();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const openRisks = risks.filter((r) => r.status === "Open");
  const overdueTasks = openRisks.filter(
    (r) => new Date(r.reviewDate) < new Date()
  );

  const notifications = [
    ...overdueTasks.map((r) => ({
      message: `Overdue risk review: ${r.riskDescription}`,
    })),
    ...openRisks
      .filter((r) => !overdueTasks.includes(r))
      .map((r) => ({
        message: `Pending action for risk: ${r.riskDescription}`,
      })),
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm relative">
      <div className="text-primary font-semibold text-lg">Dashboard</div>

      <div ref={dropdownRef} className="relative flex items-center gap-4">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative text-accent hover:text-primary transition-colors"
        >
          🔔
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full px-1">
              {notifications.length}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 mt-10 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-3 border-b text-sm font-semibold text-textDark">
              Notifications
            </div>
            {notifications.length > 0 ? (
              <ul className="max-h-60 overflow-y-auto">
                {notifications.map((note, i) => (
                  <li
                    key={i}
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {note.message}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-sm text-gray-500">
                🎉 All caught up — no pending items!
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
