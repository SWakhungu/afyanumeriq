"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ShieldAlert,
  CheckCircle,
  ClipboardList,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div
      className={`h-screen bg-teal-800 text-white flex flex-col transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* --- Logo Section --- */}
      <div
        className={`flex items-center justify-between ${
          collapsed ? "p-3" : "p-4"
        } transition-all`}
      >
        <div className="flex items-center justify-center w-full">
          <Image
            src="/AfyaNumeriq LOGO.png" // ✅ Updated logo file (official one in /public)
            alt="AfyaNumeriq Logo"
            width={collapsed ? 40 : 120}
            height={collapsed ? 40 : 120}
            priority
            className={`transition-all duration-300 ${
              collapsed ? "mx-auto" : "mx-0"
            }`}
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = "none";
              const fallback = document.createElement("div");
              fallback.innerText = "AfyaNumeriq";
              fallback.style.color = "white";
              fallback.style.fontWeight = "bold";
              fallback.style.fontSize = collapsed ? "0.8rem" : "1.2rem";
              fallback.style.textAlign = "center";
              target.parentElement?.appendChild(fallback);
            }}
          />
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-white focus:outline-none ml-2"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* --- Navigation Menu --- */}
      <nav className="mt-4 flex flex-col gap-1">
        <SidebarLink
          href="/"
          icon={<Home size={18} />}
          label="Dashboard"
          collapsed={collapsed}
          active={pathname === "/"}
        />

        <SidebarLink
          href="/risk"
          icon={<ShieldAlert size={18} />}
          label="Risks"
          collapsed={collapsed}
          active={pathname === "/risk"}
        />

        <SidebarLink
          href="/compliance"
          icon={<CheckCircle size={18} />}
          label="Compliance"
          collapsed={collapsed}
          active={pathname === "/compliance"}
        />

        <SidebarLink
          href="/audit"
          icon={<ClipboardList size={18} />}
          label="Audits"
          collapsed={collapsed}
          active={pathname === "/audit"}
        />

        <SidebarLink
          href="/reports"
          icon={<FileText size={18} />}
          label="Reports"
          collapsed={collapsed}
          active={pathname === "/reports"}
        />

        <SidebarLink
          href="/settings"
          icon={<Settings size={18} />}
          label="Settings"
          collapsed={collapsed}
          active={pathname === "/settings"}
        />
      </nav>
    </div>
  );
};

// --- Helper Component for Menu Items ---
const SidebarLink = ({ href, icon, label, collapsed, active }: any) => (
  <Link
    href={href}
    className={`flex items-center gap-2 p-3 rounded-md hover:bg-teal-700 transition-colors ${
      active ? "bg-teal-700" : ""
    }`}
  >
    {icon}
    {!collapsed && <span>{label}</span>}
  </Link>
);

export default Sidebar;
