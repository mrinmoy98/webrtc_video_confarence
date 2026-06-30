
export default function Reactions({ reactions }) {
  return (
    <div className="reactions-layer">
      {reactions.map((r, i) => (
        <div
          key={r.key}
          className="reaction-float"
          style={{ left: `${8 + ((i * 13 + (r.key.length * 7)) % 78)}%` }}
        >
          <span className="reaction-emoji">{r.emoji}</span>
          <span className="reaction-name">{r.name}</span>
        </div>
      ))}
    </div>
  );
}
