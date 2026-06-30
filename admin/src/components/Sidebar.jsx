const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'users', label: 'Users', icon: '👥' },
  { key: 'meetings', label: 'Live meetings', icon: '🎥' },
];

export default function Sidebar({ page, setPage }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="logo">🎥</span>
        <div className="sidebar-brand-text">
          <strong>Video Conference</strong>
          <span className="badge">Super Admin</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-label">Menu</span>
        {NAV.map((item) => (
          <button
            key={item.key}
            className={`nav-item ${page === item.key ? 'active' : ''}`}
            onClick={() => setPage(item.key)}
          >
            <span className="nav-ic">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        <span className="sidebar-version">Admin Panel · v1.0.0</span>
      </div>
    </aside>
  );
}
