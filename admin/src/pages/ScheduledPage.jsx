import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

function fmtWhen(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
  catch { return '—'; }
}

export default function ScheduledPage() {
  const [meetings, setMeetings] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try { const r = await api.scheduled(); setMeetings(r.meetings || []); }
    catch (e) { setError(e.message); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(m) {
    if (!window.confirm(`Delete "${m.title}"? This cannot be undone.`)) return;
    setError(''); setBusyId(m._id);
    try { await api.deleteScheduled(m._id); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusyId(null); }
  }

  const now = Date.now();

  return (
    <div className="page">
      <div className="page-toolbar">
        <span className="muted">{meetings.length} scheduled meeting{meetings.length === 1 ? '' : 's'}</span>
        <button className="btn ghost small" onClick={load}>↻ Refresh</button>
      </div>

      {error && <div className="error banner">{error}</div>}

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th><th>When</th><th>Duration</th><th>Host</th>
              <th>Room</th><th>Status</th><th className="right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {meetings.length === 0 && (
              <tr><td colSpan={7} className="empty">No meetings have been scheduled yet.</td></tr>
            )}
            {meetings.map((m) => {
              const upcoming = new Date(m.scheduledAt).getTime() >= now;
              return (
                <tr key={m._id}>
                  <td>
                    <span className="avatar">🗓️</span>
                    {m.title}
                  </td>
                  <td className="muted">{fmtWhen(m.scheduledAt)}</td>
                  <td className="muted">{m.durationMins} min</td>
                  <td className="muted">{m.createdByName || '—'}</td>
                  <td className="muted mono">{m.roomId}</td>
                  <td>
                    <span className={`pill ${upcoming ? 'pill-active' : 'pill-off'}`}>
                      {upcoming ? 'Upcoming' : 'Past'}
                    </span>
                  </td>
                  <td className="right">
                    <button className="btn danger small" disabled={busyId === m._id} onClick={() => remove(m)}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
