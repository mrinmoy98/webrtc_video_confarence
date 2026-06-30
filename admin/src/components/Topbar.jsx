import { useEffect, useState } from 'react';
import ConfirmModal from './ConfirmModal.jsx';

export default function Topbar({ title, subtitle, admin, onLogout }) {
  const [clock, setClock] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const date = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      setClock(`${date} · ${time}`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2 className="topbar-title">{title}</h2>
        {subtitle && <span className="topbar-sub">{subtitle}</span>}
      </div>

      <div className="topbar-right">
        <span className="topbar-clock">{clock}</span>
        <span className="topbar-divider" />
        <div className="topbar-user">
          <span className="avatar sm">{(admin.name?.[0] || 'A').toUpperCase()}</span>
          <div className="topbar-user-text">
            <strong>{admin.name}</strong>
            <span>Super Admin</span>
          </div>
        </div>
        <button className="btn logout" onClick={() => setConfirming(true)} title="Sign out">
          <span className="logout-ic">⏻</span> Logout
        </button>
      </div>

      <ConfirmModal
        open={confirming}
        icon="⏻"
        danger
        title="Sign out?"
        message={`You'll be signed out of the admin panel, ${admin.name}. You can sign back in anytime.`}
        confirmLabel="Yes, log out"
        cancelLabel="Stay signed in"
        onConfirm={() => { setConfirming(false); onLogout(); }}
        onCancel={() => setConfirming(false)}
      />
    </header>
  );
}
