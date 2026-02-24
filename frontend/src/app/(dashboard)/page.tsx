// src/app/(dashboard)/page.tsx
"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import OverviewTab from "@/components/home/OverviewTab";
import GettingStartedTab from "@/components/home/GettingStartedTab";
import RecentUpdatesTab from "@/components/home/RecentUpdatesTab";

type TabType = "overview" | "getting-started" | "recent-updates";

export default function LandingHomePage() {
  const org = useAuthStore((s) => s.organization);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to AfyaNumeriq
        </h1>
        <p className="text-gray-600">{org?.name || "Your Organization"}</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-4 font-medium transition-colors ${
              activeTab === "overview"
                ? "text-teal-700 border-b-2 border-teal-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("getting-started")}
            className={`pb-4 font-medium transition-colors ${
              activeTab === "getting-started"
                ? "text-teal-700 border-b-2 border-teal-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Getting Started
          </button>
          <button
            onClick={() => setActiveTab("recent-updates")}
            className={`pb-4 font-medium transition-colors ${
              activeTab === "recent-updates"
                ? "text-teal-700 border-b-2 border-teal-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Recent Updates
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "getting-started" && <GettingStartedTab />}
        {activeTab === "recent-updates" && <RecentUpdatesTab org={org} />}
      </div>
    </div>
  );
}
