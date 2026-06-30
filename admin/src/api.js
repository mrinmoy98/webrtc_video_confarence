const BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'vc_admin_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try { json = await res.json(); } catch { /* no body */ }

  if (res.status === 401) {
    tokenStore.clear();
  }
  if (!res.ok) {
    const message = json?.message || json?.error || `Request failed (${res.status})`;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
  return json?.data ?? json;
}

export const api = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  me: () => request('/auth/me'),
  stats: () => request('/admin/stats'),
  users: () => request('/admin/users'),
  setActive: (id, active) =>
    request(`/admin/users/${id}/active`, { method: 'PATCH', body: { active } }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  meetings: () => request('/admin/meetings'),
};
