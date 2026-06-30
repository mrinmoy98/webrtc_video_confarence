import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { AreaChart, Donut } from '../components/Charts';

// Cumulative regular-user count for each of the last `days` days.
function cumulativeSeries(users, days = 14) {
  const out = [];
  const now = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  for (let i = days - 1; i >= 0; i--) {
    const day = startOfDay(new Date(now.getTime() - i * 86400000));
    const end = day.getTime() + 86400000;
    const count = users.filter((u) => new Date(u.created_at).getTime() < end).length;
    out.push({
      label: day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: count,
    });
  }
  return out;
}

export default function DashboardPage({ onGoUsers }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [s, u] = await Promise.all([api.stats(), api.users()]);
      setStats(s);
      setUsers((u.users || []).filter((x) => x.role === 'user'));
    } catch (e) { setError(e.message); }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 8000); // keep live-meeting counters fresh
    return () => clearInterval(id);
  }, [load]);

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active).length;
  const inactiveUsers = totalUsers - activeUsers;
  const series = cumulativeSeries(users);

  return (
    <div className="page">
      <div className="page-toolbar">
        <span className="muted">Live data · auto-refreshes every 8s</span>
        <button className="btn ghost small" onClick={load}>↻ Refresh</button>
      </div>

      {error && <div className="error banner">{error}</div>}

      <div className="stat-row">
        <div className="stat-card accent" role="button" onClick={onGoUsers}>
          <span className="stat-num">{totalUsers}</span>
          <span className="stat-label">Total users</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{activeUsers}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{inactiveUsers}</span>
          <span className="stat-label">Deactivated</span>
        </div>
        <div className="stat-card live">
          <span className="stat-num">{stats?.meetings.active ?? '—'}</span>
          <span className="stat-label">Live meetings</span>
        </div>
        <div className="stat-card live">
          <span className="stat-num">{stats?.meetings.participants ?? '—'}</span>
          <span className="stat-label">In a call now</span>
        </div>
      </div>

      <div className="chart-row">
        <div className="card chart-card wide">
          <div className="card-head">
            <h3>User growth</h3>
            <span className="muted">Total registered users · last 14 days</span>
          </div>
          <AreaChart data={series} />
        </div>

        <div className="card chart-card">
          <div className="card-head">
            <h3>User status</h3>
            <span className="muted">Active vs deactivated</span>
          </div>
          <Donut
            centerLabel="users"
            centerValue={totalUsers}
            segments={[
              { label: 'Active', value: activeUsers, color: '#1fd286' },
              { label: 'Deactivated', value: inactiveUsers, color: '#ff4d67' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
