import { Crown, MicOff, MicOn, CamOff, CamOn, Hand, X } from './Icons';

function initials(name = '?') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
}


export default function PeoplePanel({ people, canModerate, onRemove }) {
  return (
    <div className="panel-body">
      <ul className="people-list">
        {people.map((p) => (
          <li key={p.id}>
            <span className="pic">{initials(p.name)}</span>
            <span className="pname">
              {p.name}{p.you ? ' (You)' : ''}
              {p.owner && <span className="owner-chip"><Crown /> Host</span>}
            </span>
            <span className="pstatus">
              {p.handRaised && <span title="Hand raised"><Hand /></span>}
              <span title={p.muted ? 'Muted' : 'Unmuted'}>{p.muted ? <MicOff /> : <MicOn />}</span>
              <span title={p.cameraOff ? 'Camera off' : 'Camera on'}>{p.cameraOff ? <CamOff /> : <CamOn />}</span>
              {canModerate && !p.you && (
                <button className="remove-btn" title="Remove from meeting" onClick={() => onRemove(p.id)}>
                  <X />
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
