import "./globals.css";
import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "AfyaNumeriq",
  description: "Healthcare GRC Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen bg-gray-50">
        {/* Sidebar on the left */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Topbar placeholder */}
          <header className="h-14 bg-white border-b px-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">AfyaNumeriq Dashboard</div>
            <div className="flex items-center gap-4">
              <button className="text-sm text-gray-500">Notifications</button>
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
            </div>
          </header>

          {/* Page content */}
          <main className="p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
