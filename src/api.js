// Tiny fetch wrapper. REACT_APP_API_URL is the backend's address, e.g. https://tutordesk-api.vercel.app
// Tolerates common mistakes: missing https://, trailing slash, or "/api" already on the end.
function apiBase(raw) {
  let u = (raw || "http://localhost:4000").trim().replace(/\/+$/, "").replace(/\/api$/, "");
  if (!/^https?:\/\//i.test(u)) u = (/^(localhost|127\.0\.0\.1)(:|$)/.test(u) ? "http://" : "https://") + u;
  return u + "/api";
}
const BASE = apiBase(process.env.REACT_APP_API_URL);
const KEY = "td-token";

export const auth = {
  get token() { try { return localStorage.getItem(KEY); } catch { return null; } },
  set(token) { try { if (token) localStorage.setItem(KEY, token); else localStorage.removeItem(KEY); } catch { /* ignore */ } },
};

export class ApiError extends Error {
  constructor(status, code, issues) { super(code || "error"); this.status = status; this.code = code; this.issues = issues; }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = fn => { onUnauthorized = fn; };

export async function api(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(auth.token ? { Authorization: "Bearer " + auth.token } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "network");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const publicPath = ["/auth/login", "/auth/register", "/auth/forgot", "/auth/reset", "/auth/config"].some(x => path.startsWith(x));
    if ((res.status === 401 || data?.error === "account_disabled") && !publicPath && auth.token) onUnauthorized();
    throw new ApiError(res.status, data?.error, data?.issues);
  }
  return data;
}
