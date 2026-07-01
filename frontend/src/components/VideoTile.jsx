import { useEffect, useRef } from 'react';
import { Pin, MicOff, Hand } from './Icons';

function initials(name = '?') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
}

export default function VideoTile({
  stream, name, local, muted, cameraOff, handRaised, sharing,
  speaking, pinned, onPin, caption,
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream;
  }, [stream]);

  const classes = [
    'tile',
    local && !sharing ? 'mirror' : '',
    cameraOff ? 'camoff' : '',
    muted ? 'muted' : '',
    handRaised ? 'hand' : '',
    sharing ? 'screen' : '',
    speaking ? 'speaking' : '',
    pinned ? 'pinned' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <video ref={ref} autoPlay playsInline muted />
      <div className="avatar"><div className="circle">{initials(name)}</div></div>

      <button className="pin-btn" title={pinned ? 'Unpin' : 'Pin'} onClick={onPin}>
        <Pin />
      </button>

      <div className="badges">
        <span className="badge mic" title="Muted"><MicOff /></span>
        <span className="badge hand" title="Hand raised"><Hand /></span>
      </div>

      {caption && <div className="tile-caption">{caption}</div>}

      <div className="name-tag">
        {muted && <MicOff width={14} height={14} />}
        <span>{name}{local ? ' (You)' : ''}{sharing ? ' · presenting' : ''}</span>
      </div>
    </div>
  );
}
