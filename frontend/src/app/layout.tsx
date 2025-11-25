"use client";

import "./globals.css";
import AuthInit from "./providers/AuthInit";
import { useToast } from "@/components/ui/use-toast";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ToastContainer } = useToast();

  return (
    <html lang="en">
      <body>
        <AuthInit>
          {children}
          <ToastContainer />
        </AuthInit>
      </body>
    </html>
  );
}
