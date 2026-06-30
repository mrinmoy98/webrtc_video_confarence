import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TYPES } from './data';

export default function UseCasesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <>
      <section className="lp-page-hero">
        <span className="lp-eyebrow">Use cases</span>
        <h1>One app, <span className="grad">every kind of meeting</span></h1>
        <p>From quick standups to online classrooms and telehealth — Video Conference fits the way you work.</p>
      </section>

      <section className="lp-section tight">
        <div className="lp-grid-3">
          {TYPES.map((t) => (
            <div className="lp-card usecase" key={t.title}>
              <span className="lp-card-ic">{t.icon}</span>
              <span className="lp-tag">{t.tag}</span>
              <h3>{t.title}</h3>
              <p>{t.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-cta">
        <h2>Find your perfect meeting</h2>
        <p>Whatever you’re hosting, get set up in minutes.</p>
        <button className="lp-btn solid lg" onClick={() => navigate(user ? '/app' : '/register')}>
          {user ? 'Go to your meetings' : 'Get started free'}
        </button>
      </section>
    </>
  );
}
