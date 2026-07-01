import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import HeroArt from './HeroArt.jsx';
import { FEATURES } from './data';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const start = () => navigate(user ? '/app' : '/register');

  return (
    <>
      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-eyebrow">
          <span className="lp-eye-dot" />
          Now with AI-powered noise cancellation
        </div>

        <h1>
          Video calls that <em>actually</em><br />feel human.
        </h1>

        <p className="lp-hero-sub">
          {user ? 'Your meetings are waiting.' : 'Meet brings your team together with HD video, instant screen sharing, and real-time collaboration — no friction, no downloads.'}
        </p>

        <div className="lp-hero-cta">
          <button className="lp-btn solid lg" onClick={start}>
            {user ? 'Open your meetings →' : 'Start a free meeting →'}
          </button>
          <Link className="lp-btn ghost lg" to="/features">▶ Watch demo</Link>
        </div>

        <p className="lp-trust-note">
          No credit card required · Free for individuals
        </p>

        <div className="lp-hero-preview">
          <HeroArt />
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="lp-band">
        <div className="lp-band-inner">
          <div className="lp-stat"><strong>4M+</strong><span>Daily meetings</span></div>
          <div className="lp-stat"><strong>190+</strong><span>Countries</span></div>
          <div className="lp-stat"><strong>99.99%</strong><span>Uptime SLA</span></div>
          <div className="lp-stat"><strong>&lt;80ms</strong><span>Avg. latency</span></div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-section">
        <div className="lp-feat-head">
          <h2>
            Everything you need.<br />
            <em>Nothing you don't.</em>
          </h2>
        </div>
        <div className="lp-grid-3">
          {FEATURES.slice(0, 6).map((f) => (
            <div className="lp-card" key={f.title}>
              <span className="lp-card-ic">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
        <div className="lp-center">
          <Link to="/features" className="lp-btn ghost">See all features →</Link>
        </div>
      </section>

      {/* ── Split highlight ── */}
      <section className="lp-split">
        <div className="lp-split-art">
          <div className="lp-chip-card">
            <span className="lp-chip">🔒 Waiting room</span>
            <span className="lp-chip">✋ Raise hand</span>
            <span className="lp-chip">⏺️ Recording</span>
            <span className="lp-chip">💬 Chat</span>
            <span className="lp-chip">🖥️ Screen share</span>
            <span className="lp-chip">😀 Reactions</span>
          </div>
        </div>
        <div className="lp-split-text">
          <h2>Built for real conversations</h2>
          <p>
            From a quick 1:1 to a full team meeting, Video Conference keeps everyone in sync
            with host controls, a secure waiting room, and tools that just work.
          </p>
          <Link to="/use-cases" className="lp-btn solid">See use cases</Link>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta">
        <h2>Ready to start your first meeting?</h2>
        <p>Create a free account and host a meeting in under a minute.</p>
        <button className="lp-btn solid lg" onClick={start}>
          {user ? 'Go to your meetings' : 'Get started — it\'s free'}
        </button>
      </section>
    </>
  );
}
