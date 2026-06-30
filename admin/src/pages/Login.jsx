import { useState } from 'react';
import { api, tokenStore } from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { token, user } = await api.login(email.trim(), password);
      if (user.role !== 'admin') {
        setError('This account does not have admin access.');
        return;
      }
      tokenStore.set(token);
      onLogin({ id: user.id, name: user.name, email: user.email });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen center">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <span className="logo">🎥</span>
          <div>
            <strong>Video Conference</strong>
            <span className="badge">Admin</span>
          </div>
        </div>
        <h1>Admin sign in</h1>
        <p className="muted">Sign in with an administrator account.</p>

        <label className="field">
          <span>Email</span>
          <input type="email" value={email} required autoFocus
            onChange={(e) => setEmail(e.target.value)} placeholder="admin@videoconference.com" />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" value={password} required
            onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
        </label>

        {error && <div className="error">{error}</div>}

        <button className="btn primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
