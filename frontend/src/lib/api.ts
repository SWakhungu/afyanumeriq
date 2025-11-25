// src/lib/api.ts
// FORCE the backend base URL — never use 3000 for API calls.
// Be defensive: process.env.* may be undefined in some dev setups.

const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

const API_BASE = `${BACKEND.replace(/\/$/, "")}/api`;

export { API_BASE as apiBase };

// ---- HELPERS ---------------------------------------------------

async function tryRefreshToken() {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh/`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) return null;

    const data = await res.json();
    const newAccess = data.access;

    if (typeof window !== "undefined") {
      (window as any).__AFYA_ACCESS_TOKEN = newAccess;
    }

    return newAccess;
  } catch {
    return null;
  }
}

// ---- MAIN FETCH WRAPPER ----------------------------------------

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  retry = false
) {
  const url = `${API_BASE}${path}`;

  const token =
    typeof window !== "undefined" ? (window as any).__AFYA_ACCESS_TOKEN : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers ? (options.headers as Record<string, string>) : {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // debug helpful message (you can remove once stable)
  console.log("➡ apiFetch called:", { url, options, token });

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  // === HANDLE TOKEN EXPIRY ========================================
  if (res.status === 401 && !retry) {
    // try refresh flow (cookie-based refresh)
    const newToken = await tryRefreshToken();
    if (newToken) return apiFetch(path, options, true);
  }

  // === HANDLE ERRORS ==============================================
  if (!res.ok) {
    let message = `Request failed (${res.status})`;

    try {
      const json = await res.json();
      if (json && typeof json === "object" && json.detail) message = json.detail;
      else if (typeof json === "object") message = JSON.stringify(json);
      else message = String(json);
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  return res.json();
}

// ---- FILE UPLOAD ------------------------------------------------

export async function apiUpload(
  path: string,
  formData: FormData,
  options: RequestInit = {}
) {
  const url = `${API_BASE}${path}`;

  const token =
    typeof window !== "undefined" ? (window as any).__AFYA_ACCESS_TOKEN : null;

  const headers: Record<string, string> = {
    ...(options.headers ? (options.headers as Record<string, string>) : {}),
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    ...options,
    method: options.method || "POST",
    body: formData,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    let detail = "Upload failed";
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {}
    throw new Error(detail);
  }

  return res.json();
}
