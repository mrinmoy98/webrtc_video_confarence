import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

function makeRoomCode() {
  const c = 'abcdefghijkmnpqrstuvwxyz';
  const pick = (n) => Array.from({ length: n }, () => c[Math.floor(Math.random() * c.length)]).join('');
  return `${pick(3)}-${pick(4)}-${pick(3)}`;
}

function parseCode(input) {
  const s = input.trim();
  if (!s) return '';
  const m = s.match(/room\/([^/?#]+)/) || s.match(/[?&]room=([^&]+)/);
  if (m) return decodeURIComponent(m[1]);
  return s.replace(/\s+/g, '');
}

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [code, setCode] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [created, setCreated] = useState(null);
  const [clock, setClock] = useState('');
  const [userMenu, setUserMenu] = useState(false);
  const menuRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const day = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      setClock(`${time} • ${day}`);
    };
    tick();
    const id = setInterval(tick, 1000 * 30);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenu(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function claimOwnership(code) {
    const key = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(`mc_owner_${code}`, key);
  }
  function instantMeeting() {
    const c = makeRoomCode();
    claimOwnership(c);
    navigate(`/prejoin/${c}`);
  }
  function createForLater() {
    const c = makeRoomCode();
    claimOwnership(c);
    setCreated({ code: c, link: `${window.location.origin}/room/${c}` });
    setMenuOpen(false);
  }
  function join() {
    const c = parseCode(code);
    if (c) navigate(`/prejoin/${encodeURIComponent(c)}`);
  }

  return (
    <div className="home">
      <header className="home-top">
        <div className="home-brand">
          <span className="logo">🎥</span>
          <span className="brand-name">Video Conference</span>
        </div>
        <div className="home-top-right">
          <span className="clock">{clock}</span>
          <ThemeToggle />
          <div className="user-menu" ref={userRef}>
            <button className="user-chip" onClick={() => setUserMenu((v) => !v)}>
              <span className="user-avatar">{(user?.name?.[0] || '?').toUpperCase()}</span>
              <span className="user-name">{user?.name}</span>
              <span className="caret">▾</span>
            </button>
            {userMenu && (
              <div className="user-dropdown">
                <div className="user-dropdown-head">
                  <strong>{user?.name}</strong>
                  <span>{user?.email}</span>
                </div>
                <button onClick={logout}>Sign out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="home-body">
        <aside className="home-rail">
          <button className="rail-item active">📅 <span>Meetings</span></button>
          <button className="rail-item">🎞️ <span>Calls</span></button>
        </aside>

        <main className="home-main">
          <h1 className="home-title">Video calls and meetings for everyone</h1>
          <p className="home-sub">Connect, collaborate, and celebrate from anywhere with Video Conference</p>

          <div className="home-actions">
            <div className="new-meeting" ref={menuRef}>
              <button className="btn primary new-btn" onClick={() => setMenuOpen((v) => !v)}>
                🎥 New meeting <span className="caret">▾</span>
              </button>
              {menuOpen && (
                <div className="new-menu">
                  <button onClick={createForLater}>🔗 Create a meeting for later</button>
                  <button onClick={instantMeeting}>➕ Start an instant meeting</button>
                </div>
              )}
            </div>

            <div className="join-box">
              <span className="join-ic">⌨️</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && join()}
                placeholder="Enter a code or link"
              />
            </div>
            <button className={`join-link ${parseCode(code) ? 'on' : ''}`} onClick={join} disabled={!parseCode(code)}>
              Join
            </button>
          </div>

          {created && (
            <div className="created-card">
              <p>Here's your joining info. Send it to people you want in the meeting. Save it for later too.</p>
              <div className="created-row">
                <code>{created.link}</code>
                <button className="btn ghost small" onClick={() => navigator.clipboard?.writeText(created.link)}>Copy</button>
              </div>
              <button className="btn primary small" onClick={() => navigate(`/prejoin/${created.code}`)}>Join now</button>
            </div>
          )}

          <div className="home-hero">
            <div className="hero-illo">🔗</div>
            <p className="hero-cap">Get a link you can share — anyone with it can join, instantly.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
