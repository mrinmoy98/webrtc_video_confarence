import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../../components/ThemeToggle';
import { CamOn } from '../../components/Icons';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/features', label: 'Features' },
  { to: '/use-cases', label: 'Use cases' },
  { to: '/blog', label: 'Blog' },
  { to: '/contact', label: 'Contact us' },
];

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="lp-header">
      <Link to="/" className="lp-brand" onClick={() => setOpen(false)}>
        <span className="lp-logo"><CamOn /></span>
        <span className="lp-brand-name">Video Conference</span>
      </Link>

      <nav className={`lp-nav ${open ? 'open' : ''}`}>
        {NAV.map((n) => (
          <NavLink
            key={n.to} to={n.to} end={n.end}
            className={({ isActive }) => `lp-nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setOpen(false)}
          >
            {n.label}
          </NavLink>
        ))}
      </nav>

      <div className="lp-actions">
        <ThemeToggle />
        {user ? (
          <>
            <button className="lp-btn ghost" onClick={() => navigate('/app')}>Open app</button>
            <button className="lp-btn solid" onClick={logout}>Sign out</button>
          </>
        ) : (
          <>
            <Link className="lp-login" to="/login">Login</Link>
            <Link className="lp-btn solid" to="/register">Sign up free</Link>
          </>
        )}
        <button className="lp-burger" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? '✕' : '☰'}
        </button>
      </div>
    </header>
  );
}
