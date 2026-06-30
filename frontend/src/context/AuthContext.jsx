import { createContext, useContext, useEffect, useState } from 'react';
import { api, tokenStore } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function restore() {
      if (!tokenStore.get()) { setLoading(false); return; }
      try {
        const me = await api.me();
        if (active) setUser({ id: me._id || me.id, name: me.name, email: me.email, role: me.role });
      } catch {
        tokenStore.clear();
      } finally {
        if (active) setLoading(false);
      }
    }
    restore();
    return () => { active = false; };
  }, []);

  async function login(email, password) {
    const { token, user: u } = await api.login(email, password);
    tokenStore.set(token);
    setUser(u);
    return u;
  }

  async function register(name, email, password) {
    const { token, user: u } = await api.register(name, email, password);
    tokenStore.set(token);
    setUser(u);
    return u;
  }

  function logout() {
    tokenStore.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
