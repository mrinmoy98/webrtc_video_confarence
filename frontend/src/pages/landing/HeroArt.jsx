// Dark browser-window video grid — inspired by Google Meet's hero mockup.
const PARTICIPANTS = [
  { initials: 'SC', name: 'Sarah',  color: '#4f8cff', muted: false },
  { initials: 'MW', name: 'Marcus', color: '#e84a7c', muted: true  },
  { initials: 'PN', name: 'Priya',  color: '#9b5de5', muted: false },
  { initials: 'TO', name: 'Tom',    color: '#f5a623', muted: true  },
  { initials: 'LM', name: 'Lena',   color: '#1fa89a', muted: false },
];

// Layout: 3 cols × 2 rows inside 960×540 viewport
const W = 960, H = 540;
const BAR = 42, GAP = 2;
const COLS = 3;
const inner_w = W; const inner_h = H - BAR;
const tile_w = Math.floor((inner_w - GAP * (COLS - 1)) / COLS);
const tile_h = Math.floor((inner_h - GAP) / 2);
function tileX(col) { return col * (tile_w + GAP); }
function tileY(row) { return BAR + row * (tile_h + GAP); }

export default function HeroArt() {
  return (
    <svg
      className="lp-hero-svg"
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Video conference with participants"
    >
      <defs>
        <clipPath id="haBrowser"><rect width={W} height={H} /></clipPath>
        <filter id="haShadow"><feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity=".5" /></filter>
      </defs>

      {/* browser bg */}
      <rect width={W} height={H} fill="#111" />

      {/* title bar */}
      <rect width={W} height={BAR} fill="#1a1a1a" />
      <line x1="0" y1={BAR} x2={W} y2={BAR} stroke="#2a2a2a" strokeWidth="1" />

      {/* traffic lights */}
      <circle cx="20" cy="21" r="5.5" fill="#ff5f57" />
      <circle cx="37" cy="21" r="5.5" fill="#febc2e" />
      <circle cx="54" cy="21" r="5.5" fill="#28c840" />

      {/* URL bar */}
      <rect x="160" y="11" width="480" height="20" rx="5" fill="#242424" />
      <text x="400" y="24.5" fill="#555" fontSize="10" textAnchor="middle" fontFamily="monospace">
        meet.videoconf.app/hzy-kxpo-aef
      </text>

      {/* ── Tiles ── */}
      {PARTICIPANTS.slice(0, 3).map((p, i) => (
        <Tile key={p.initials} p={p} x={tileX(i)} y={tileY(0)} w={tile_w} h={tile_h} />
      ))}
      {/* row 2: 2 filled + 1 local-preview tile */}
      {PARTICIPANTS.slice(3, 5).map((p, i) => (
        <Tile key={p.initials} p={p} x={tileX(i)} y={tileY(1)} w={tile_w} h={tile_h} />
      ))}
      {/* 6th tile: local / you */}
      <g>
        <rect x={tileX(2)} y={tileY(1)} width={tile_w} height={tile_h} fill="#181818" />
        <rect x={tileX(2)} y={tileY(1)} width={tile_w} height={tile_h} fill="none" stroke="#2a2a2a" strokeWidth="1" />
        <text x={tileX(2) + tile_w / 2} y={tileY(1) + tile_h / 2 - 6} fill="#444" fontSize="28" textAnchor="middle">📷</text>
        <text x={tileX(2) + tile_w / 2} y={tileY(1) + tile_h / 2 + 20} fill="#555" fontSize="11" textAnchor="middle">You (camera off)</text>
      </g>

      {/* ── Info chip top-left ── */}
      <rect x="10" y={BAR + 10} width="168" height="36" rx="8" fill="rgba(30,30,30,.95)" stroke="#2a2a2a" strokeWidth="1" />
      <circle cx="27" cy={BAR + 28} r="8" fill="#1fa89a" />
      <text x="26" y={BAR + 32} fill="#fff" fontSize="9" textAnchor="middle">👥</text>
      <text x="42" y={BAR + 24} fill="#fff" fontSize="10" fontWeight="600">1,847 people</text>
      <text x="42" y={BAR + 37} fill="#777" fontSize="9">in calls right now</text>

      {/* ── E2E badge bottom-right ── */}
      <rect x={W - 188} y={H - 48} width="178" height="38" rx="8" fill="rgba(30,30,30,.95)" stroke="#2a2a2a" strokeWidth="1" />
      <circle cx={W - 170} cy={H - 29} r="9" fill="rgba(11,92,255,.25)" />
      <text x={W - 170} y={H - 25} fill="#4f8cff" fontSize="11" textAnchor="middle">🔒</text>
      <text x={W - 155} y={H - 33} fill="#fff" fontSize="10" fontWeight="600">End-to-end encrypted</text>
      <text x={W - 155} y={H - 20} fill="#666" fontSize="9">Every call, always</text>
    </svg>
  );
}

function Tile({ p, x, y, w, h }) {
  const cx = x + w / 2, cy = y + h / 2;
  const r = Math.min(w, h) * 0.18;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#1a1a1a" />
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#2a2a2a" strokeWidth="1" />
      {/* avatar */}
      <circle cx={cx} cy={cy - 6} r={r} fill={p.color} />
      <text x={cx} y={cy - 6 + r * 0.38} fill="#fff" fontSize={r * 0.72} textAnchor="middle" fontWeight="700" fontFamily="'Plus Jakarta Sans',system-ui">{p.initials}</text>
      {/* name bar */}
      <rect x={x + 8} y={y + h - 28} width={p.muted ? 110 : 80} height="20" rx="4" fill="rgba(0,0,0,.65)" />
      {p.muted && (
        <>
          <circle cx={x + 22} cy={y + h - 18} r="7" fill="#e84a7c" />
          <text x={x + 22} y={y + h - 14} fill="#fff" fontSize="8" textAnchor="middle">🔇</text>
        </>
      )}
      <text x={x + (p.muted ? 34 : 16)} y={y + h - 14} fill="#fff" fontSize="11" fontFamily="'Plus Jakarta Sans',system-ui">{p.name}</text>
    </g>
  );
}
