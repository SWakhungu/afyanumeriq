// frontend/src/app/(dashboard)/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useSearchParams } from "next/navigation";

type Organization = {
  id: number;
  name: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
};

type User = {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  profile?: {
    role: "admin" | "auditor" | "staff";
    department?: string;
    created_at?: string;
  };
};

export default function SettingsPage() {
  const { show } = useToast();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "organization" | "users") || "organization";
  const [activeTab, setActiveTab] = useState<"organization" | "users">(initialTab);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Organization form state
  const [orgForm, setOrgForm] = useState({
    name: "",
    website: "",
    email: "",
    phone: "",
    address: "",
  });

  // Create user form state
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "staff" as const,
    department: "",
  });

  // Edit user form state
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    role: "staff",
    department: "",
    is_active: true,
  });

  // Load data
  useEffect(() => {
    loadOrganization();
    loadUsers();
  }, []);

  const loadOrganization = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/settings/organization/");
      setOrganization(data);
      setOrgForm({
        name: data.name || "",
        website: data.website || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
      });
    } catch (err: any) {
      show(`Failed to load organization: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/settings/users/");
      setUsers(data);
    } catch (err: any) {
      show(`Failed to load users: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const saveOrganization = async () => {
    try {
      setSaving(true);
      const updated = await apiFetch("/settings/organization/", {
        method: "PUT",
        body: JSON.stringify(orgForm),
      });
      setOrganization(updated);
      try {
        useAuthStore.getState().setOrganization(updated);
      } catch {}
      show("Organization settings saved ✅", "success");
    } catch (err: any) {
      const msg = err?.message || JSON.stringify(err) || "Unknown error";
      show(`Failed to save: ${msg}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const createUser = async () => {
    if (!userForm.username || !userForm.email || !userForm.password) {
      show("Please fill in username, email and password", "error");
      return;
    }

    try {
      setSaving(true);
      const newUser = await apiFetch("/settings/users/", {
        method: "POST",
        body: JSON.stringify(userForm),
      });
      setUsers((prev) => [...prev, newUser]);
      setUserForm({ username: "", email: "", password: "", role: "staff", department: "" });
      setShowCreateUserModal(false);
      show("User created successfully ✅", "success");
    } catch (err: any) {
      show(`Failed to create user: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setEditForm({
      username: u.username,
      email: u.email,
      role: u.profile?.role || "staff",
      department: u.profile?.department || "",
      is_active: u.is_active !== false,
    });
  };

  const saveEditedUser = async () => {
    if (!editingUser) return;
    try {
      setSaving(true);
      const updated = await apiFetch(`/settings/users/${editingUser.id}/`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });
      setUsers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditingUser(null);
      show("User updated ✅", "success");
    } catch (err: any) {
      show(`Failed to update user: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

      const deactivateUser = async (userId: number, username: string) => {
        if (!confirm(`Deactivate user "${username}"?`)) return;
        try {
          setSaving(true);
          await apiFetch(`/settings/users/${userId}/`, { method: "DELETE" });
          setUsers((prev) => prev.filter((u) => u.id !== userId));
          setUsers((prev) =>  
            prev.map((u) => (u.id === userId ? { ...u, is_active: false } : u))
          );
          show("User deactivated ✅", "success");
        } catch (err: any) {
          show(`Failed to deactivate user: ${err.message}`, "error");
        } finally {
          setSaving(false);
        }
      };
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your organization and users</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("organization")}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === "organization"
              ? "border-teal-600 text-teal-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Organization
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === "users"
              ? "border-teal-600 text-teal-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Users
        </button>
      </div>

      {/* Organization Tab */}
      {activeTab === "organization" && (
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Organization Settings</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                value={orgForm.name}
                onChange={(e) =>
                  setOrgForm({ ...orgForm, name: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                value={orgForm.website}
                onChange={(e) =>
                  setOrgForm({ ...orgForm, website: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={orgForm.email}
                onChange={(e) =>
                  setOrgForm({ ...orgForm, email: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={orgForm.phone}
                onChange={(e) =>
                  setOrgForm({ ...orgForm, phone: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={orgForm.address}
                onChange={(e) =>
                  setOrgForm({ ...orgForm, address: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows={3}
              />
            </div>

            <Button onClick={saveOrganization} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </Card>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Users</h2>
            <Button onClick={() => setShowCreateUserModal(true)}>
              + Create User
            </Button>
          </div>

          {/* Create User Modal */}
          {showCreateUserModal && (
            <Card className="p-6 space-y-4 border-teal-200 bg-teal-50">
              <h3 className="text-lg font-semibold">Create New User</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) =>
                      setUserForm({ ...userForm, username: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) =>
                      setUserForm({ ...userForm, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) =>
                      setUserForm({ ...userForm, password: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,
                        role: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="staff">Staff</option>
                    <option value="auditor">Auditor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={userForm.department}
                    onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={createUser} disabled={saving}>
                    {saving ? "Creating..." : "Create User"}
                  </Button>
                  <Button
                    onClick={() => setShowCreateUserModal(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-900"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Edit User Modal */}
          {editingUser && (
            <Card className="p-6 space-y-4 border-gray-200 bg-white">
              <h3 className="text-lg font-semibold">Edit User</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="staff">Staff</option>
                    <option value="auditor">Auditor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={saveEditedUser} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={() => setEditingUser(null)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-900"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Users Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Username</th>
                    <th className="px-6 py-3 text-left font-semibold">Email</th>
                    <th className="px-6 py-3 text-left font-semibold">Role</th>
                    <th className="px-6 py-3 text-left font-semibold">Department</th>
                    <th className="px-6 py-3 text-left font-semibold">Created</th>
                    <th className="px-6 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3">{user.username}</td>
                      <td className="px-6 py-3">{user.email}</td>
                      <td className="px-6 py-3">
                        <select
                          value={user.profile?.role || "staff"}
                          onChange={(e) => {
                            // quick role update inline
                            const newRole = e.target.value;
                            (async () => {
                              try {
                                await apiFetch(`/settings/users/${user.id}/`, {
                                  method: "PUT",
                                  body: JSON.stringify({ role: newRole }),
                                });
                                setUsers((prev) => prev.map((p) => (p.id === user.id ? { ...p, profile: { ...(p.profile || {}), role: newRole } } : p)));
                                show("Role updated ✅", "success");
                              } catch (err: any) {
                                show(`Failed to update role: ${err.message}`, "error");
                              }
                            })();
                          }}
                          className="px-3 py-1 border rounded text-sm"
                        >
                          <option value="staff">Staff</option>
                          <option value="auditor">Auditor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>

                      <td className="px-6 py-3">{user.profile?.department || "—"}</td>

                      <td className="px-6 py-3 text-xs text-gray-600">
                        {user.profile?.created_at ? new Date(user.profile.created_at).toLocaleDateString() : "—"}
                      </td>

                      <td className="px-6 py-3">
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => openEditUser(user)}
                            className="text-teal-600 hover:text-teal-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deactivateUser(user.id, user.username)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Deactivate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {users.length === 0 && (
              <div className="p-6 text-center text-gray-500">No users yet. Create one to get started.</div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
