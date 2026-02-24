// src/components/home/RecentUpdatesTab.tsx
"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Organization {
  id?: number;
  name?: string;
}

interface Update {
  id: number;
  title: string;
  description: string;
  date: string;
  category: "feature" | "bugfix" | "announcement" | "maintenance";
}

export default function RecentUpdatesTab({}: { org?: Organization }) {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUpdates() {
      try {
        // Fetch platform updates from backend
        const data = await apiFetch("/platform-updates/");
        const updateList = Array.isArray(data) ? data : data.updates || [];
        // Sort by date, newest first
        updateList.sort(
          (a: Update, b: Update) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        setUpdates(updateList);
      } catch (err) {
        console.error("Failed to load platform updates:", err);
        setUpdates([]);
      } finally {
        setLoading(false);
      }
    }

    loadUpdates();
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "feature":
        return "bg-green-100 text-green-800";
      case "bugfix":
        return "bg-orange-100 text-orange-800";
      case "announcement":
        return "bg-blue-100 text-blue-800";
      case "maintenance":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryLabel = (category: string) => {
    return (
      category.charAt(0).toUpperCase() + category.slice(1).replace("-", " ")
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Platform Updates</h2>
        <p className="text-gray-600">
          This is the activity feed for updates in the platform's functionality
          and general support notifications from us.
        </p>
      </div>

      {/* Updates List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          Loading updates...
        </div>
      ) : updates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No updates at this time</p>
          <p className="text-gray-400 text-sm mt-2">
            Check back soon for platform announcements and feature releases.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => (
            <div
              key={update.id}
              className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex-1">
                  {update.title}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getCategoryColor(
                    update.category,
                  )}`}
                >
                  {getCategoryLabel(update.category)}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-4">{update.description}</p>

              <div className="text-xs text-gray-500">
                {formatDate(update.date)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note about notifications */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Note:</span> Platform updates appear
          here. Organization and standard-specific notifications (audits, findings,
          risks) are shown in the Notifications bell in the top bar.
        </p>
      </div>
    </div>
  );
}
