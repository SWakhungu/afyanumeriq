"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("📌 Login submit triggered (handleSubmit)");
    console.log(
      "📌 username:",
      username ? "(provided)" : "(empty)",
      "password:",
      password ? "(provided)" : "(empty)"
    );

    setError("");
    setLoading(true);

    try {
      console.log("📌 About to call apiFetch('/auth/login/') ...");
      const response = await apiFetch("/auth/login/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      console.log("apiFetch returned:", response);
      // Store access token and user in Zustand
      setAuth(response.access, response.user);
      console.log("➡ setAuth done, redirecting to /");
      // Redirect to dashboard
      router.push("/");
    } catch (err: any) {
      console.error("Login error (caught):", err);
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
      console.log("handleSubmit finished");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#eaf4f4]">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-[380px] p-8 shadow-xl rounded-xl"
      >
        <h1 className="text-2xl font-bold text-center text-[#0c6b63] mb-6">
          AfyaNumeriq Login
        </h1>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 rounded border mb-4"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded border mb-4"
        />

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0c6b63] hover:bg-[#09574f] text-white py-2 rounded transition"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-sm mt-4">
          Don't have an account?{" "}
          <a href="/signup" className="text-[#0c6b63] font-medium">
            Sign up
          </a>
        </p>
      </form>
    </div>
  );
}
