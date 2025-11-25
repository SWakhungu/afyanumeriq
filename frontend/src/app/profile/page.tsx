"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function ProfilePage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();

  const [loadingUser, setLoadingUser] = useState(true);

  // Password-change state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /**
   * STEP 1 — Fetch authenticated user from backend
   * This prevents redirect loops on page refresh.
   */
  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await apiFetch("/auth/me/", {
          method: "GET",
        });

        // Update global store with latest user info
        if (response) {
          setAuth(null, response);
        }

        setLoadingUser(false);
      } catch (err: any) {
        // If backend says 401 → user not authenticated → redirect to login
        console.warn("Profile load failed:", err.message);
        router.push("/login");
      }
    }

    // Only fetch if user missing
    if (!user) fetchUser();
    else setLoadingUser(false);
  }, [user, router, setAuth]);

  if (loadingUser)
    return (
      <div className="p-10 text-center text-gray-600">Loading profile…</div>
    );

  if (!user)
    return (
      <div className="p-10 text-center text-gray-600">Redirecting…</div>
    );

  /**
   * STEP 2 — Change password handler
   */
  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    try {
      setLoading(true);

      await apiFetch("/auth/change-password/", {
        method: "POST",
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      setMessage("Password updated successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-10">
      <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>

      {/* Profile Card */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6 space-y-5">
        <div>
          <label className="text-sm text-gray-500">Username</label>
          <div className="mt-1 text-lg font-medium text-gray-800">
            {user.username}
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-500">Email</label>
          <div className="mt-1 text-lg font-medium text-gray-800">
            {user.email || "—"}
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-500">Role</label>
          <div className="mt-1 text-lg font-medium text-gray-800">
            {user.profile?.role || "staff"}
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-500">Department</label>
          <div className="mt-1 text-lg font-medium text-gray-800">
            {user.profile?.department || "—"}
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Change Password
        </h2>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {message && (
            <div className="text-green-600 text-sm">{message}</div>
          )}

          <div>
            <label className="text-sm text-gray-500">Current Password</label>
            <input
              type="password"
              className="mt-1 w-full border rounded-md px-3 py-2"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-500">New Password</label>
            <input
              type="password"
              className="mt-1 w-full border rounded-md px-3 py-2"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-500">
              Confirm New Password
            </label>
            <input
              type="password"
              className="mt-1 w-full border rounded-md px-3 py-2"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
