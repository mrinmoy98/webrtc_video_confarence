// Original, royalty-free SVG illustration of a video call (no external image asset,
// so there is zero copyright risk and it always loads — even offline).
export default function HeroArt() {
  return (
    <svg className="lp-hero-svg" viewBox="0 0 540 430" xmlns="http://www.w3.org/2000/svg" role="img"
      aria-label="People in a video conference">
      <defs>
        <linearGradient id="lpScreen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0b5cff" /><stop offset="100%" stopColor="#4d9fff" />
        </linearGradient>
        <linearGradient id="lpScreen2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2d8cff" /><stop offset="100%" stopColor="#7cc0ff" />
        </linearGradient>
        <linearGradient id="lpTile1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#eaf2ff" /><stop offset="100%" stopColor="#cfe0ff" />
        </linearGradient>
        <linearGradient id="lpTile2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#dff0e6" /><stop offset="100%" stopColor="#bfe6cf" />
        </linearGradient>
        <linearGradient id="lpTile3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe7ef" /><stop offset="100%" stopColor="#ffc9dd" />
        </linearGradient>
        <filter id="lpSoft" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="18" stdDeviation="24" floodColor="#0b5cff" floodOpacity="0.22" />
        </filter>
      </defs>

      {/* main app window */}
      <g filter="url(#lpSoft)">
        <rect x="34" y="40" width="472" height="320" rx="22" fill="#ffffff" stroke="#e4e9f2" />
        {/* title bar */}
        <path d="M34 62 a22 22 0 0 1 22-22 h428 a22 22 0 0 1 22 22 v18 H34 z" fill="#f4f8ff" />
        <circle cx="60" cy="61" r="5" fill="#ff5f57" />
        <circle cx="78" cy="61" r="5" fill="#febc2e" />
        <circle cx="96" cy="61" r="5" fill="#28c840" />
        <rect x="220" y="53" width="100" height="16" rx="8" fill="#e4ecfb" />

        {/* spotlight (big) tile with active-speaker ring */}
        <rect x="54" y="96" width="278" height="244" rx="14" fill="url(#lpScreen)" />
        <rect x="50" y="92" width="286" height="252" rx="16" fill="none" stroke="#28c840" strokeWidth="3" opacity="0.9" />
        <circle cx="193" cy="196" r="46" fill="#ffffff" opacity="0.92" />
        <path d="M193 226 c-34 0-56 20-56 42 h112 c0-22-22-42-56-42z" fill="#ffffff" opacity="0.92" />
        <rect x="68" y="312" width="96" height="18" rx="9" fill="rgba(0,0,0,0.28)" />
        <circle cx="80" cy="321" r="5" fill="#fff" />

        {/* side tiles */}
        <g>
          <rect x="346" y="96" width="148" height="76" rx="12" fill="url(#lpTile1)" />
          <circle cx="420" cy="128" r="18" fill="#0b5cff" opacity="0.85" />
          <path d="M420 142 c-13 0-22 7-22 16 h44 c0-9-9-16-22-16z" fill="#0b5cff" opacity="0.85" />

          <rect x="346" y="180" width="148" height="76" rx="12" fill="url(#lpTile2)" />
          <circle cx="420" cy="212" r="18" fill="#1aa861" />
          <path d="M420 226 c-13 0-22 7-22 16 h44 c0-9-9-16-22-16z" fill="#1aa861" />

          <rect x="346" y="264" width="148" height="76" rx="12" fill="url(#lpTile3)" />
          <circle cx="420" cy="296" r="18" fill="#e84d8a" />
          <path d="M420 310 c-13 0-22 7-22 16 h44 c0-9-9-16-22-16z" fill="#e84d8a" />
        </g>
      </g>

      {/* floating control bar */}
      <g filter="url(#lpSoft)">
        <rect x="170" y="356" width="200" height="52" rx="26" fill="#ffffff" stroke="#e4e9f2" />
        <circle cx="200" cy="382" r="14" fill="#eaf2ff" />
        <circle cx="238" cy="382" r="14" fill="#eaf2ff" />
        <rect x="262" y="368" width="40" height="28" rx="14" fill="#ff4d67" />
        <circle cx="324" cy="382" r="14" fill="#eaf2ff" />
        <circle cx="352" cy="382" r="9" fill="#eaf2ff" />
      </g>
    </svg>
  );
}
