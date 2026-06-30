import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import LandingLayout from './pages/landing/LandingLayout.jsx';
import HomePage from './pages/landing/HomePage.jsx';
import FeaturesPage from './pages/landing/FeaturesPage.jsx';
import UseCasesPage from './pages/landing/UseCasesPage.jsx';
import BlogPage from './pages/landing/BlogPage.jsx';
import ContactPage from './pages/landing/ContactPage.jsx';
import Home from './pages/Home.jsx';
import Prejoin from './pages/Prejoin.jsx';
import Room from './pages/Room.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import './styles.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="auth-screen"><div className="auth-loading">Loading…</div></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth-screen"><div className="auth-loading">Loading…</div></div>;
  if (user) return <Navigate to="/app" replace />;
  return children;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ThemeProvider>
    <AuthProvider>
      <Routes>
        <Route element={<LandingLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/use-cases" element={<UseCasesPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
        <Route path="/app" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/prejoin/:roomId" element={<ProtectedRoute><Prejoin /></ProtectedRoute>} />
        <Route path="/room/:roomId" element={<ProtectedRoute><Room /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>,
);
