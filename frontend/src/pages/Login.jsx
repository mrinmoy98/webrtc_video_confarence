import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import { CamOn, Home } from '../components/Icons';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/app';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
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
        <h1 className="auth-title">Sign in</h1>
        <p className="auth-sub">Welcome back — sign in to start or join a meeting.</p>

        <form onSubmit={onSubmit} className="auth-form">
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email" value={email} required autoFocus
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
            />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <input
              type="password" value={password} required
              onChange={(e) => setPassword(e.target.value)} placeholder="Your password"
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button className="btn primary auth-btn" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-foot">
          New here? <Link to="/register" state={{ from: redirectTo }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
