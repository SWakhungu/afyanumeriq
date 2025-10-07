"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ShieldAlert,
  CheckCircle,
  ClipboardList,
  FileText,
  Settings,
} from "lucide-react";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Risk", href: "/risk", icon: ShieldAlert },
  { name: "Compliance", href: "/compliance", icon: CheckCircle },
  { name: "Audit", href: "/audit", icon: ClipboardList },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname() || "/";
  return (
    <aside className="w-64 bg-primary text-white h-screen p-4 flex flex-col">
      <div className="mb-8 text-xl font-bold flex items-center gap-2">
        <span className="text-2xl">🩺</span> AfyaNumeriq
      </div>
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive
                  ? "bg-secondary text-primary font-semibold"
                  : "hover:bg-secondary/20"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
