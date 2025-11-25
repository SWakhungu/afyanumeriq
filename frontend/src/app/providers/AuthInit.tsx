"use client";

import { useEffect } from "react";
import { apiBase } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function AuthInit({ children }: { children: React.ReactNode }) {
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    async function init() {
      try {
        // Request new access token using HttpOnly refresh cookie
        const res = await fetch(`${apiBase}/auth/refresh/`, {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) {
          console.warn("AuthInit: no active session");
          return;
        }

        const data = await res.json();
        const access = data.access;

        // Save token in memory
        (window as any).__AFYA_ACCESS_TOKEN = access;

        // Fetch user session
        const meRes = await fetch(`${apiBase}/auth/me/`, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });

        if (meRes.ok) {
          const user = await meRes.json();
          setAuth(access, user);
        }
      } catch (err) {
        console.error("AuthInit error:", err);
      }
    }

    init();
  }, [setAuth]);

  return <>{children}</>;
}
