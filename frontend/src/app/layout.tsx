import "./globals.css";
import Sidebar from "@/components/sidebar";
import { Bell } from "lucide-react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col relative">
          {/* Bell notification at top right */}
          <div className="absolute top-6 right-8 z-10">
            <button
              className="p-2 rounded-full bg-white shadow hover:bg-gray-100 transition"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <main className="p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
