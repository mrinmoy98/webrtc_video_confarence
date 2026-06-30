import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FEATURES } from './data';

export default function FeaturesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <>
      <section className="lp-page-hero">
        <span className="lp-eyebrow">Features</span>
        <h1>Everything you need to <span className="grad">meet</span></h1>
        <p>A complete video meeting toolkit — secure, fast and friction-free, right in your browser.</p>
      </section>

      <section className="lp-section tight">
        <div className="lp-grid-3">
          {FEATURES.map((f) => (
            <div className="lp-card" key={f.title}>
              <span className="lp-card-ic">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-cta">
        <h2>Try it yourself</h2>
        <p>All features are free while you’re getting started.</p>
        <button className="lp-btn solid lg" onClick={() => navigate(user ? '/app' : '/register')}>
          {user ? 'Go to your meetings' : 'Sign up free'}
        </button>
      </section>
    </>
  );
}
