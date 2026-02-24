// src/lib/api.ts
// FORCE the backend base URL — never use 3000 for API calls.
// Be defensive: process.env.* may be undefined in some dev setups.

// src/lib/api.ts

const BACKEND =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : (process.env.NEXT_PUBLIC_BACKEND ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://127.0.0.1:8000");

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

  let token =
  typeof window !== "undefined" ? (window as any).__AFYA_ACCESS_TOKEN : null;

  if (!token && typeof window !== "undefined" && !retry) {
    // First call after reload: try cookie-based refresh to bootstrap access token
    token = await tryRefreshToken();
  }


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

// ---- FILE DOWNLOAD (BLOB) --------------------------------------

export async function apiFetchBlob(
  path: string,
  options: RequestInit = {},
  retry = false
) {
  const url = `${API_BASE}${path}`;

  let token =
    typeof window !== "undefined" ? (window as any).__AFYA_ACCESS_TOKEN : null;

  if (!token && typeof window !== "undefined" && !retry) {
    // bootstrap access token using cookie refresh
    token = await tryRefreshToken();
  }

  const headers: Record<string, string> = {
    ...(options.headers ? (options.headers as Record<string, string>) : {}),
  };

  // IMPORTANT: do NOT force Content-Type for downloads
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  // try refresh once on 401
  if (res.status === 401 && !retry) {
    const newToken = await tryRefreshToken();
    if (newToken) return apiFetchBlob(path, options, true);
  }

  if (!res.ok) {
    // attempt to parse json error, fallback to text
    let message = `Download failed (${res.status})`;
    try {
      const json = await res.json();
      if (json && typeof json === "object" && (json as any).detail)
        message = (json as any).detail;
      else message = JSON.stringify(json);
    } catch {
      try {
        message = await res.text();
      } catch {}
    }
    throw new Error(message);
  }

  const blob = await res.blob();

  // optional: filename from Content-Disposition
  const cd = res.headers.get("content-disposition") || "";
  let filename: string | null = null;
  const match = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
  if (match?.[1]) filename = decodeURIComponent(match[1]);

  return { blob, filename };
}
