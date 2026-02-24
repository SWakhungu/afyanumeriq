"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function NewThirdPartyPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    criticality: "medium",
    scope_of_dependency: "",
    review_frequency_months: 12,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiFetch("/tprm/third-parties/", {
        method: "POST",
        body: JSON.stringify(form),
      });

      router.push("/tprm/third-parties");
    } catch (e: any) {
      setError(e?.message || "Failed to create third party.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/tprm/third-parties")}
          className="text-sm text-teal-700 hover:underline inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to registry
        </button>

        <h1 className="text-2xl font-semibold text-gray-900">
          Add Third Party
        </h1>
      </div>

      <p className="text-sm text-gray-600 max-w-2xl">
        Register a new third party to assess and manage risks arising from
        external dependencies across operational, security, financial, legal,
        and strategic domains.
      </p>

      <form
        onSubmit={submit}
        className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-6"
      >
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}

        {/* Name */}
        <Field label="Third Party Name" required>
          <input
            className="input"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />
        </Field>

        {/* Category */}
        <Field label="Category">
          <input
            className="input"
            placeholder="e.g. SaaS, Consultant, Supplier"
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
          />
        </Field>

        {/* Criticality */}
        <Field label="Criticality">
          <select
            className="input"
            value={form.criticality}
            onChange={(e) => update("criticality", e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </Field>

        {/* Scope */}
        <Field label="Scope of Dependency">
          <textarea
            className="input"
            rows={3}
            placeholder="Describe how this third party supports operations, systems, data, or services"
            value={form.scope_of_dependency}
            onChange={(e) => update("scope_of_dependency", e.target.value)}
          />
        </Field>

        {/* Review frequency */}
        <Field label="Review Frequency (months)">
          <input
            type="number"
            min={1}
            className="input"
            value={form.review_frequency_months}
            onChange={(e) =>
              update("review_frequency_months", Number(e.target.value))
            }
          />
        </Field>

        {/* Description */}
        <Field label="Description">
          <textarea
            className="input"
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </Field>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/tprm/third-parties")}
            className="px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Saving…" : "Create Third Party"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- small helpers ---------- */

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
