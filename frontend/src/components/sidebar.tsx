"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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

export function Sidebar() {
  const pathname = usePathname() || "/";

  return (
    <aside className="w-64 bg-white shadow-md h-screen p-4 flex flex-col">
      {/* Logo / Title */}
      <div className="mb-6 text-2xl font-bold text-blue-600">AfyaNumeriq</div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md hover:bg-blue-50 transition-colors",
                isActive
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "text-gray-700"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-6 text-sm text-gray-500">
        <div>v0.1 • Beta</div>
      </div>
    </aside>
  );
}
