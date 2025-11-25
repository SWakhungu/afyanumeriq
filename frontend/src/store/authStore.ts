import { create } from "zustand";
import { apiBase } from "@/lib/api";

type User = {
  id: number;
  username: string;
  email?: string;
  profile: {
    role: string;
    department?: string;
    created_at?: string;
  };
};

type AuthState = {
  access: string | null;
  user: User | null;
  organization: { id?: number; name?: string } | null;
  setAuth: (access: string | null, user: User | null) => void;
  setOrganization: (org: { id?: number; name?: string } | null) => void;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  access: null,
  user: null,
  organization: null,

  setAuth: (access, user) => {
    set({ access, user });
    if (typeof window !== "undefined") {
      (window as any).__AFYA_ACCESS_TOKEN = access;
    }
  },

  setOrganization: (org) => {
    set({ organization: org });
  },

  logout: async () => {
    try {
      console.log("🚪 Logging out...");
      const response = await fetch(`${apiBase}/auth/logout/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      console.log(`🚪 Logout response: ${response.status}`);
    } catch (err) {
      console.error("🚪 Logout API call failed:", err);
    }
    console.log("🚪 Clearing auth state...");
    set({ access: null, user: null, organization: null });
    if (typeof window !== "undefined") {
      (window as any).__AFYA_ACCESS_TOKEN = null;
      localStorage.removeItem("auth_state");
    }
    console.log("🚪 Logout complete");
  },
}));
