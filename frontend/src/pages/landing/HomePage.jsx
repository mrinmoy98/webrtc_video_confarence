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
      {/* Hero banner with image */}
      <section className="lp-hero">
        <div className="lp-hero-text">
          <span className="lp-eyebrow">✨ Meetings made simple</span>
          <h1>Video conferencing<br /><span className="grad">for everyone</span></h1>
          <p>
            Connect, collaborate and celebrate from anywhere. Start a secure HD meeting in
            seconds — no downloads, just share a link.
          </p>
          <div className="lp-hero-cta">
            <button className="lp-btn solid lg" onClick={start}>
              {user ? 'Go to your meetings' : 'Sign up free'}
            </button>
            <Link className="lp-btn ghost lg" to="/features">Explore features</Link>
          </div>
          <div className="lp-trust">
            <span>🔒 Peer-to-peer encrypted</span>
            <span className="sep">•</span>
            <span>🌍 Works in your browser</span>
          </div>
        </div>
        <div className="lp-hero-art">
          <div className="lp-stage">
            <span className="lp-glow" />
            <div className="lp-card-3d"><HeroArt /></div>
            <span className="lp-float f1">🎉 Reactions</span>
            <span className="lp-float f2"><span className="rec-dot" /> Recording</span>
            <span className="lp-float f3">🔒 Encrypted</span>
            <span className="lp-float f4">👥 4 joined</span>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="lp-band">
        <div className="lp-band-inner">
          <div className="lp-stat"><strong>HD</strong><span>video & audio</span></div>
          <div className="lp-stat"><strong>0</strong><span>downloads needed</span></div>
          <div className="lp-stat"><strong>1</strong><span>click to join</span></div>
          <div className="lp-stat"><strong>100%</strong><span>browser based</span></div>
        </div>
      </section>

      {/* Feature teaser */}
      <section className="lp-section">
        <div className="lp-section-head">
          <h2>Everything you need to meet</h2>
          <p>Powerful features, zero friction.</p>
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

      {/* Split highlight */}
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
            with host controls, a secure waiting room and tools that just work.
          </p>
          <Link to="/use-cases" className="lp-btn solid">See use cases</Link>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <h2>Ready to start your first meeting?</h2>
        <p>Create a free account and host a meeting in under a minute.</p>
        <button className="lp-btn solid lg" onClick={start}>
          {user ? 'Go to your meetings' : 'Get started — it’s free'}
        </button>
      </section>
    </>
  );
}
