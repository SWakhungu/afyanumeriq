// src/lib/api.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
console.log("🔎 API_BASE =", API_BASE);


export async function apiFetch(url: string, options: any = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

/**
 * Upload helper for evidence / file uploads
 * Accepts FormData (so DO NOT set content-type header manually)
 */
export async function apiUpload(url: string, formData: FormData) {
  const res = await fetch(`${API_BASE}${url}`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export const apiBase = API_BASE;    