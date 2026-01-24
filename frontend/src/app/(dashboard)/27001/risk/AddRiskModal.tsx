"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function AddRiskModal({ assets, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    asset: "",
    likelihood: 3,
    impact: 3,
  });

  async function createRisk(e) {
    e.preventDefault();

    const payload = {
      title: form.title,
      description: form.description,
      asset_id: Number(form.asset),
      likelihood: form.likelihood,
      impact: form.impact,
      standard: "iso-27001",
    };

    const created = await apiFetch("/isms/risks/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    onCreated(created);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <form
        onSubmit={createRisk}
        className="bg-white rounded-lg p-6 w-full max-w-lg space-y-4"
      >
        <h2 className="text-lg font-semibold">Add Risk</h2>

        <input
          required
          placeholder="Risk title"
          className="w-full border px-3 py-2 rounded"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <textarea
          placeholder="Description"
          className="w-full border px-3 py-2 rounded"
          rows={2}
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />

        {/* ASSET SELECTION — THIS IS THE KEY */}
        <select
          required
          className="w-full border px-3 py-2 rounded"
          value={form.asset}
          onChange={(e) => setForm({ ...form, asset: e.target.value })}
        >
          <option value="">Select asset</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-4">
          Likelihood
          <select
            value={form.likelihood}
            onChange={(e) =>
              setForm({ ...form, likelihood: Number(e.target.value) })
            }
            className="border px-3 py-2 rounded"
          >
            {[1,2,3,4,5].map((v) => <option key={v}>{v}</option>)}
          </select>
           Impact
          <select
            value={form.impact}
            onChange={(e) =>
              setForm({ ...form, impact: Number(e.target.value) })
            }
            className="border px-3 py-2 rounded"
          >
            {[1,2,3,4,5].map((v) => <option key={v}>{v}</option>)}
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}>Cancel</button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            Create Risk
          </button>
        </div>
      </form>
    </div>
  );
}
