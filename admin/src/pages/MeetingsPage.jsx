import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { const r = await api.meetings(); setMeetings(r.meetings || []); }
    catch (e) { setError(e.message); }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000); // live refresh
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="page">
      <div className="page-toolbar">
        <span className="muted">{meetings.length} meeting{meetings.length === 1 ? '' : 's'} in progress · auto-refreshes every 5s</span>
        <button className="btn ghost small" onClick={load}>↻ Refresh</button>
      </div>

      {error && <div className="error banner">{error}</div>}

      {meetings.length === 0 ? (
        <div className="card"><div className="empty pad">No meetings are live right now.</div></div>
      ) : (
        <div className="meeting-grid">
          {meetings.map((m) => (
            <div key={m.roomId} className="meeting-card">
              <div className="meeting-head">
                <strong>{m.roomId}</strong>
                <span className="pill pill-active">{m.participants} in call</span>
              </div>
              <div className="meeting-meta">
                <span>{m.hasOwner ? '👑 Host present' : '⏳ No host'}</span>
                {m.waiting > 0 && <span>· {m.waiting} waiting</span>}
              </div>
              <ul className="meeting-people">
                {m.people.map((p, i) => (
                  <li key={i}>
                    {p.isOwner ? '👑 ' : ''}{p.name}
                    {p.muted ? ' 🔇' : ''}{p.cameraOff ? ' 📷✕' : ''}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
