// src/components/sidebar.tsx
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
  Network,
} from "lucide-react";

/**
 * All standards that have their own dashboard root
 * /7101  
 * /27001
 * /42001
 * etc.
 */

const PREFIX_STANDARDS = new Set(["7101", "27001", "42001", "13485", "15189", "17025"]);

/**
 * Optional per-standard landing overrides per module.
 * Example:
 *   For ISO 27001, "Risks" should start on Assets.
 */
const NAV_OVERRIDES: Record<string, Partial<Record<NavKey, string>>> = {
  "27001": {
    risks: "/assets",
    // compliance: "/compliance",
    // audits: "/audit",
    // reports: "/reports",
  },
};

type NavKey =
  | "home"
  | "risks"
  | "compliance"
  | "audits"
  | "reports"
  | "tprm"
  | "settings";

function getStandardPrefix(pathname: string) {
  // "/27001/compliance" -> "27001"
  const first = (pathname.split("/")[1] || "").trim();
  return PREFIX_STANDARDS.has(first) ? first : null;
}

function buildHref(base: string, key: NavKey) {
  const std = base.replace("/", ""); // "" or "27001" etc

  // Default module routes
  const defaults: Record<NavKey, string> = {
    home: "/",
    risks: "/risk",
    compliance: "/compliance",
    audits: "/audit",
    reports: "/reports",
    tprm: "/tprm",
    settings: "/settings",
  };

  // Apply per-standard overrides (e.g., 27001 risks => /assets)
  const override = std ? NAV_OVERRIDES[std]?.[key] : undefined;
  const path = override ?? defaults[key];

  // ISO 7101 is root (base="") => "/risk"
  // Other standards have base="/27001" => "/27001/risk" or "/27001/assets"
  if (!base) return path;
  // If we are on landing page (no standard prefix in URL),
  // keep Home on "/" but still allow other links to work.
  if (!base) return key === "home" ? "/" : path;

  // Special case: home should go to the base itself ("/27001")
  if (key === "home") return base;

  return `${base}${path}`;
}

function isActive(pathname: string, href: string) {
  // exact match OR "startsWith href/" for section highlighting
  if (href === "/") return pathname === "/";
  if (pathname === href) return true;
  return pathname.startsWith(href + "/");
}

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname() || "/";

  const std = getStandardPrefix(pathname);
  const base = std ? `/${std}` : ""; // "" means ISO 7101 root

  const links = [
    {
      key: "home" as const,
      label: "Home",
      icon: <Home size={18} />,
      href: buildHref(base, "home"),
    },
    {
      key: "risks" as const,
      label: "Risks",
      icon: <ShieldAlert size={18} />,
      href: buildHref(base, "risks"),
    },
    {
      key: "compliance" as const,
      label: "Compliance",
      icon: <CheckCircle size={18} />,
      href: buildHref(base, "compliance"),
    },
    {
      key: "audits" as const,
      label: "Audits",
      icon: <ClipboardList size={18} />,
      href: buildHref(base, "audits"),
    },
    {
      key: "reports" as const,
      label: "Reports",
      icon: <FileText size={18} />,
      href: buildHref(base, "reports"),
    },
    {
      key: "tprm" as const,
      label: "TPRM",
      icon: <Network size={18} />,
      href: buildHref(base, "tprm"),
    },
    {
      key: "settings" as const,
      label: "Settings",
      icon: <Settings size={18} />,
      href: buildHref(base, "settings"),
    },
  ];

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
            src="/AfyaNumeriq LOGO.png"
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
        {links.map((l) => (
          <SidebarLink
            key={l.key}
            href={l.href}
            icon={l.icon}
            label={l.label}
            collapsed={collapsed}
            active={isActive(pathname, l.href)}
          />
        ))}
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
