import { API_URL } from "./config";

async function request(path, { signal, ...options } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    signal,
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      // FastAPI: {"detail": "..."} or validation list [{"msg": "..."}]
      if (typeof body.detail === "string") message = body.detail;
      else if (Array.isArray(body.detail)) {
        message = body.detail.map((d) => d.msg).join(", ");
      }
    } catch {
      /* response had no JSON body */
    }
    throw new Error(message);
  }

  return res.status === 204 ? null : res.json();
}

export const api = {
  register: (details) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(details) }),

  login: (credentials) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),

  me: () => request("/auth/me"),

  logout: () => request("/auth/logout", { method: "POST" }),

  list: (q = "", signal) =>
    request(`/items${q ? `?q=${encodeURIComponent(q)}` : ""}`, { signal }),

  create: (item) =>
    request("/items", { method: "POST", body: JSON.stringify(item) }),

  // originalId lets you change the item's id too.
  update: (originalId, item) =>
    request(`/items/${originalId}`, {
      method: "PUT",
      body: JSON.stringify(item),
    }),

  remove: (id) => request(`/items/${id}`, { method: "DELETE" }),
};
