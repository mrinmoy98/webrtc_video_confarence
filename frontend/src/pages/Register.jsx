import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import { CamOn, Home } from '../components/Icons';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/app';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setBusy(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-topbar">
        <Link to="/" className="theme-toggle" title="Home" aria-label="Home"><Home /></Link>
        <ThemeToggle />
      </div>
      <div className="auth-card">
        <div className="auth-brand">
          <span className="logo"><CamOn /></span>
          <span className="brand-name">Video Conference</span>
        </div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-sub">Register once, then host or join meetings anytime.</p>

        <form onSubmit={onSubmit} className="auth-form">
          <label className="auth-field">
            <span>Full name</span>
            <input
              value={name} required autoFocus maxLength={40}
              onChange={(e) => setName(e.target.value)} placeholder="Jane Doe"
            />
          </label>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email" value={email} required
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
            />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <input
              type="password" value={password} required minLength={6}
              onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters"
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button className="btn primary auth-btn" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-foot">
          Already have an account? <Link to="/login" state={{ from: redirectTo }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
