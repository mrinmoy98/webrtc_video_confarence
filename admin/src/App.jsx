import { useEffect, useState } from 'react';
import { api, tokenStore } from './api';
import Login from './pages/Login.jsx';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import Footer from './components/Footer.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import MeetingsPage from './pages/MeetingsPage.jsx';

const PAGES = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview of users and live meetings' },
  users: { title: 'Users', subtitle: 'Manage registered users' },
  meetings: { title: 'Live meetings', subtitle: 'Meetings in progress right now' },
};

function Shell({ admin, onLogout }) {
  const [page, setPage] = useState('dashboard');
  const meta = PAGES[page];
  return (
    <div className="layout">
      <Sidebar page={page} setPage={setPage} />
      <div className="main-col">
        <Topbar title={meta.title} subtitle={meta.subtitle} admin={admin} onLogout={onLogout} />
        <main className="content">
          {page === 'dashboard' && <DashboardPage onGoUsers={() => setPage('users')} />}
          {page === 'users' && <UsersPage />}
          {page === 'meetings' && <MeetingsPage />}
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function restore() {
      if (!tokenStore.get()) { setLoading(false); return; }
      try {
        const me = await api.me();
        if (me.role !== 'admin') { tokenStore.clear(); }
        else if (active) setAdmin({ id: me._id || me.id, name: me.name, email: me.email });
      } catch {
        tokenStore.clear();
      } finally {
        if (active) setLoading(false);
      }
    }
    restore();
    return () => { active = false; };
  }, []);

  function onLogin(user) { setAdmin(user); }
  function logout() { tokenStore.clear(); setAdmin(null); }

  if (loading) return <div className="screen center"><div className="muted">Loading…</div></div>;
  if (!admin) return <Login onLogin={onLogin} />;
  return <Shell admin={admin} onLogout={logout} />;
}
