"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiFetch("/auth/login/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      setAuth(response.access, response.user);
      router.push("/");
    } catch {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto min-h-screen w-full max-w-6xl px-6 lg:px-10">
        <div className="grid min-h-screen grid-cols-1 items-center gap-10 py-10 lg:grid-cols-12 lg:py-0">
          {/* LEFT */}
          <div className="lg:col-span-5">
            

            <form
              onSubmit={handleSubmit}
              className="w-full max-w-[420px] rounded-2xl border border-gray-100 bg-white p-8 shadow-lg"
            >
              <h2 className="text-xl font-semibold text-gray-900">AfyaNumeriq GRC</h2>
              
          

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-3 outline-none focus:border-[#0c6b63]"
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-3 outline-none focus:border-[#0c6b63]"
                    autoComplete="current-password"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full rounded-lg bg-[#0c6b63] py-3 font-medium text-white transition hover:bg-[#09574f] disabled:opacity-50"
                >
                  {loading ? "Logging in..." : "Log in"}
                </button>

                <p className="text-center text-sm text-gray-600">
                  Having trouble logging in?{" "}
                  <a
                    href="https://www.nzasi.com/#contact"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[#0c6b63] hover:underline"
                  >
                    Contact us
                  </a>
                </p>
              </div>
            </form>

            
          </div>

          {/* RIGHT (WIDE HERO BLOCK) */}
          <div className="lg:col-span-7">
            {/* Desktop hero: big, wide, tall, rounded like PECB */}
            <div className="relative hidden h-[680px] w-full overflow-hidden rounded-[56px] bg-gray-100 shadow-xl lg:block">
              <Image
                src="/Login-right.jpg"
                alt="Login hero"
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 58vw, 100vw"
              />
            </div>

            {/* Mobile/tablet: still wide, but shorter */}
            <div className="relative h-[420px] w-full overflow-hidden rounded-3xl bg-gray-100 shadow-lg lg:hidden">
              <Image
                src="/Login-right.jpg"
                alt="Login hero"
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
