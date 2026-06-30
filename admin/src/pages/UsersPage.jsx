import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
  catch { return '—'; }
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await api.users();
      // Only regular users — the super admin manages, it isn't a listed user.
      setUsers((r.users || []).filter((u) => u.role === 'user'));
    } catch (e) { setError(e.message); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(u) {
    setError(''); setBusyId(u._id);
    try { await api.setActive(u._id, !u.is_active); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusyId(null); }
  }

  async function removeUser(u) {
    if (!window.confirm(`Delete ${u.name} (${u.email})? This cannot be undone.`)) return;
    setError(''); setBusyId(u._id);
    try { await api.deleteUser(u._id); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusyId(null); }
  }

  const filtered = users.filter((u) => {
    const q = query.trim().toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="page">
      <div className="page-toolbar">
        <span className="muted">{users.length} registered user{users.length === 1 ? '' : 's'}</span>
        <input
          className="search" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or email…"
        />
      </div>

      {error && <div className="error banner">{error}</div>}

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Status</th>
              <th>Last login</th><th>Joined</th><th className="right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="empty">{users.length ? 'No matches.' : 'No users have registered yet.'}</td></tr>
            )}
            {filtered.map((u) => (
              <tr key={u._id}>
                <td>
                  <span className="avatar">{(u.name?.[0] || '?').toUpperCase()}</span>
                  {u.name}
                </td>
                <td className="muted">{u.email}</td>
                <td>
                  <span className={`pill ${u.is_active ? 'pill-active' : 'pill-off'}`}>
                    {u.is_active ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td className="muted">{fmtDate(u.last_login)}</td>
                <td className="muted">{fmtDate(u.created_at)}</td>
                <td className="right">
                  <div className="row-actions">
                    <button className="btn ghost small" disabled={busyId === u._id} onClick={() => toggleActive(u)}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="btn danger small" disabled={busyId === u._id} onClick={() => removeUser(u)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
