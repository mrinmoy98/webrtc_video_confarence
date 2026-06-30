// Lightweight dependency-free SVG charts.

/**
 * Area + line chart for a time series.
 * data: [{ label: string, value: number }]
 */
export function AreaChart({ data, height = 220, color = '#2d8cff' }) {
  const W = 640;
  const H = height;
  const padL = 36;
  const padB = 26;
  const padT = 14;
  const padR = 14;

  if (!data.length) {
    return <div className="chart-empty">No data yet.</div>;
  }

  const max = Math.max(1, ...data.map((d) => d.value));
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;
  const x = (i) => padL + stepX * i;
  const y = (v) => padT + innerH - (v / max) * innerH;

  const linePts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ');
  const areaPts = `${padL},${padT + innerH} ${linePts} ${padL + stepX * (data.length - 1)},${padT + innerH}`;

  // 4 horizontal gridlines.
  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  const labelEvery = Math.ceil(data.length / 7);

  return (
    <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {gridVals.map((gv, i) => {
        const gy = y(gv);
        return (
          <g key={i}>
            <line x1={padL} y1={gy} x2={W - padR} y2={gy} stroke="rgba(255,255,255,0.08)" />
            <text x={padL - 8} y={gy + 4} textAnchor="end" className="chart-axis">{gv}</text>
          </g>
        );
      })}

      <polygon points={areaPts} fill="url(#areaFill)" />
      <polyline points={linePts} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinejoin="round" strokeLinecap="round" />

      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.value)} r="3.5" fill={color} />
          {i % labelEvery === 0 && (
            <text x={x(i)} y={H - 8} textAnchor="middle" className="chart-axis">{d.label}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

/**
 * Donut chart.
 * segments: [{ label, value, color }]
 */
export function Donut({ segments, size = 180, thickness = 26, centerLabel, centerValue }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const arcs = segments.map((seg, i) => {
    const frac = total > 0 ? seg.value / total : 0;
    const len = frac * circ;
    const dash = `${len} ${circ - len}`;
    const el = (
      <circle
        key={i} cx={c} cy={c} r={r} fill="none"
        stroke={seg.color} strokeWidth={thickness}
        strokeDasharray={dash} strokeDashoffset={-offset}
        transform={`rotate(-90 ${c} ${c})`}
      />
    );
    offset += len;
    return el;
  });

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
        {total > 0 && arcs}
        <text x={c} y={c - 4} textAnchor="middle" className="donut-num">{centerValue ?? total}</text>
        <text x={c} y={c + 16} textAnchor="middle" className="donut-cap">{centerLabel}</text>
      </svg>
      <div className="donut-legend">
        {segments.map((seg, i) => (
          <div key={i} className="legend-item">
            <span className="legend-dot" style={{ background: seg.color }} />
            {seg.label} <strong>{seg.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
