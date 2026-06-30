export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <span className="footer-left">© {year} Video Conference — Admin Panel</span>
      <span className="footer-right">
        <span className="status-dot" /> All systems operational
        <span className="footer-sep">·</span> v1.0.0
      </span>
    </footer>
  );
}
