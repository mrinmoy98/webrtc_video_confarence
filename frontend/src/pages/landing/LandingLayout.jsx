import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import './landing.css';

export default function LandingLayout() {
  const { pathname } = useLocation();
  const scrollRef = useRef(null);

  // Scroll to top on route change (each landing page starts fresh).
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className="lp-site" ref={scrollRef}>
      <Header />
      <main className="lp-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
