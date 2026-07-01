import { Link } from 'react-router-dom';
import { CamOn } from '../../components/Icons';

export default function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-top">
          <div className="lp-footer-brand">
            <span className="lp-logo"><CamOn /></span>
            <span className="lp-brand-name">Video Conference</span>
            <p>Secure, browser-based video meetings for everyone.</p>
          </div>
          <div className="lp-footer-cols">
            <div>
              <h4>Product</h4>
              <Link to="/features">Features</Link>
              <Link to="/use-cases">Use cases</Link>
              <Link to="/blog">Blog</Link>
            </div>
            <div>
              <h4>Company</h4>
              <Link to="/contact">Contact us</Link>
              <Link to="/blog">News</Link>
            </div>
            <div>
              <h4>Get started</h4>
              <Link to="/login">Login</Link>
              <Link to="/register">Sign up free</Link>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>© {new Date().getFullYear()} Video Conference. All rights reserved.</span>
          <span>Built with WebRTC</span>
        </div>
      </div>
    </footer>
  );
}
