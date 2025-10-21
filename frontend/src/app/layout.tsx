"use client";

import "./globals.css";
import Sidebar from "@/components/sidebar";
import { Bell, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Favicon from "/AfyaNumeriq Favicon.png";


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <html lang="en">
      <body className="flex min-h-screen bg-gray-50">
        <Sidebar />

        <div className="flex-1 flex flex-col relative">
          {/* Top-right icons */}
          <div className="absolute top-6 right-8 z-10 flex items-center gap-3">
            {/* Notifications */}
            <button
              className="p-2 rounded-full bg-white shadow hover:bg-gray-100 transition"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600" />
            </button>

            {/* User profile */}
            <div className="relative" ref={dropdownRef}>
              <button
                className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold hover:bg-teal-700 transition"
                title="User profile"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                SW
              </button>

              {/* Dropdown */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg ring-1 ring-gray-200 animate-fade-in">
                  <ul className="py-1 text-sm text-gray-700">
                    <li>
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
                        View Profile
                      </button>
                    </li>
                    <li>
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
                        Settings
                      </button>
                    </li>
                    <li>
                      <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Page content */}
          <main className="p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
