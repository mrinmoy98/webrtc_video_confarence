import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useWebRTC } from '../hooks/useWebRTC';
import ThemeToggle from '../components/ThemeToggle';
import VideoTile from '../components/VideoTile';
import ChatPanel from '../components/ChatPanel';
import PeoplePanel from '../components/PeoplePanel';
import Reactions from '../components/Reactions';
import SettingsModal from '../components/SettingsModal';
import {
  MicOn, MicOff, CamOn, CamOff, Screen, Smile, Hand, Captions,
  Record, Chat, People, Expand, Collapse, Gear, Phone, Check, X, Crown,
} from '../components/Icons';

const EMOJIS = ['👍', '❤️', '😂', '🎉', '👏', '😮', '🙏'];

function WaitingScreen({ stream, roomId, onCancel }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current && stream) ref.current.srcObject = stream; }, [stream]);
  return (
    <div className="screen center-msg">
      <div className="wait-card">
        <div className="wait-preview">
          <video ref={ref} autoPlay playsInline muted />
        </div>
        <h2>Asking to be let in…</h2>
        <p className="tagline">The host will admit you to <strong>{roomId}</strong> shortly.</p>
        <div className="wait-spinner" />
        <button className="btn ghost small" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function EndedScreen({ reason, roomId, onHome, onRejoin }) {
  return (
    <div className="screen center-msg">
      <div className="lobby-card">
        <h2>👋 You've left the meeting</h2>
        <p className="tagline">{reason}</p>
        <div className="lobby-actions">
          <button className="btn primary" onClick={onRejoin}>Rejoin</button>
          <button className="btn ghost" onClick={onHome}>Return to home</button>
        </div>
        <p className="tagline" style={{ fontSize: 12 }}>{roomId}</p>
      </div>
    </div>
  );
}

function AudioSink({ stream, onBlocked }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !stream) return;
    el.srcObject = stream;
    const p = el.play?.();
    if (p?.catch) p.catch(() => onBlocked?.());
  }, [stream, onBlocked]);
  return <audio ref={ref} autoPlay playsInline />;
}

function SwitchedScreen({ roomId, onSwitchBack, onHome }) {
  return (
    <div className="screen center-msg">
      <div className="lobby-card">
        <h2>Call switched to another device</h2>
        <p className="tagline">
          This meeting is now open in another tab or device on your account.
          You can bring it back here.
        </p>
        <div className="lobby-actions">
          <button className="btn primary" onClick={onSwitchBack}>Switch back</button>
          <button className="btn ghost" onClick={onHome}>Return to home</button>
        </div>
        <p className="tagline" style={{ fontSize: 12 }}>{roomId}</p>
      </div>
    </div>
  );
}

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const joinInfo = location.state || {
    name: localStorage.getItem('mc_name') || 'Guest',
    micOn: true, camOn: true, camId: '', micId: '',
  };

  const {
    localStream, peers, messages,
    micOn, camOn, sharing, handRaised, status, errorMsg, endedReason,
    reactions, captions, activeSpeaker, recording,
    isOwner, waitingList,
    toggleMic, toggleCam, toggleShare, toggleHand, sendChat,
    sendReaction, sendCaption, switchCamera, switchMic, toggleRecording,
    admit, deny, removeParticipant, endMeeting,
  } = useWebRTC(roomId, joinInfo.name, { micOn: joinInfo.micOn, camOn: joinInfo.camOn });

  const [panel, setPanel] = useState(null);
  const [copied, setCopied] = useState(false);
  const [unread, setUnread] = useState(0);
  const [pinnedId, setPinnedId] = useState(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [captionNote, setCaptionNote] = useState('');
  const [myCaption, setMyCaption] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startTsRef = useRef(Date.now());

  const peerList = useMemo(() => Object.values(peers), [peers]);
  const sharer = peerList.find((p) => p.sharingScreen);
  const spotlightId = pinnedId || (sharing ? 'local' : sharer ? sharer.id : null);

  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTsRef.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (panel !== 'chat' && messages.length) {
      const last = messages[messages.length - 1];
      if (!last.system) setUnread((u) => u + 1);
    }
  }, [messages]);
  useEffect(() => { if (panel === 'chat') setUnread(0); }, [panel]);

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    if (!captionsOn) { setCaptionNote(''); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setCaptionNote('Captions need Google Chrome.'); return; }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || 'en-US';
    let stopped = false;
    rec.onresult = (e) => {
      setCaptionNote('');
      let text = '';
      let final = false;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        if (e.results[i].isFinal) final = true;
      }
      setMyCaption(text);
      sendCaption(text, final);
      if (final) setTimeout(() => setMyCaption(''), 2500);
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed')
        setCaptionNote('Allow microphone access for captions.');
      else if (e.error === 'audio-capture')
        setCaptionNote('No microphone found for captions.');
      else if (e.error === 'network')
        setCaptionNote('Captions need an internet connection.');
    };
    rec.onend = () => { if (!stopped) { try { rec.start(); } catch { } } };
    try { rec.start(); } catch { }
    return () => { stopped = true; rec.onend = null; rec.onerror = null; try { rec.stop(); } catch { } };
  }, [captionsOn, sendCaption]);

  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key.toLowerCase() === 'm') toggleMic();
      if (e.key.toLowerCase() === 'v') toggleCam();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleMic, toggleCam]);

  function copyLink() {
    const url = `${window.location.origin}/room/${encodeURIComponent(roomId)}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }
  function enableAudio() {
    document.querySelectorAll('audio').forEach((el) => el.play?.().catch(() => { }));
    setAudioBlocked(false);
  }
  function togglePin(id) { setPinnedId((p) => (p === id ? null : id)); }
  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  }
  function react(emoji) { sendReaction(emoji); setEmojiOpen(false); }
  function leave() {
    if (isOwner) endMeeting();
    navigate('/app');
  }

  if (status === 'error') {
    return (
      <div className="screen center-msg">
        <div className="lobby-card">
          <h2>⚠️ Can't join the call</h2>
          <p className="tagline">{errorMsg}</p>
          <button className="btn primary" onClick={() => navigate('/app')}>Back to home</button>
        </div>
      </div>
    );
  }
  if (status === 'waiting') {
    return <WaitingScreen stream={localStream} roomId={roomId} onCancel={() => navigate('/app')} />;
  }
  if (status === 'switched') {
    return (
      <SwitchedScreen
        roomId={roomId}
        onSwitchBack={() => window.location.reload()}
        onHome={() => navigate('/app')}
      />
    );
  }
  if (status === 'ended') {
    return (
      <EndedScreen
        reason={endedReason}
        roomId={roomId}
        onHome={() => navigate('/app')}
        onRejoin={() => navigate(`/prejoin/${encodeURIComponent(roomId)}`)}
      />
    );
  }

  const fmtElapsed = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  const peopleForPanel = [
    { id: 'me', name: joinInfo.name, you: true, owner: isOwner, muted: !micOn, cameraOff: !camOn, handRaised },
    ...peerList.map((p) => ({
      id: p.id, name: p.name, owner: p.owner, muted: p.muted, cameraOff: p.cameraOff, handRaised: p.handRaised,
    })),
  ];

  const localTile = (
    <VideoTile
      key="local" stream={localStream} name={joinInfo.name} local
      muted={!micOn} cameraOff={!camOn} handRaised={handRaised} sharing={sharing}
      speaking={activeSpeaker === 'local'} pinned={pinnedId === 'local'}
      onPin={() => togglePin('local')} caption={myCaption}
    />
  );
  const peerTiles = peerList.map((p) => (
    <VideoTile
      key={p.id} stream={p.stream} name={p.name}
      muted={p.muted} cameraOff={p.cameraOff} handRaised={p.handRaised} sharing={p.sharingScreen}
      speaking={activeSpeaker === p.id} pinned={pinnedId === p.id}
      onPin={() => togglePin(p.id)} caption={captions[p.id]?.text}
    />
  ));
  const allTiles = [localTile, ...peerTiles];
  const spotlightTile = spotlightId
    ? (spotlightId === 'local' ? localTile : peerTiles.find((t) => t.key === spotlightId))
    : null;
  const stripTiles = allTiles.filter((t) => t.key !== spotlightId);

  return (
    <div className="screen call">
      <header className="call-top">
        <div className="room-pill">
          <span className="dot" />
          <span>{roomId}</span>
          {isOwner && <span className="host-pill"><Crown /> Host</span>}
          <button className="link-btn" onClick={copyLink}>Copy link</button>
        </div>
        <div className="top-meta">
          {recording && <span className="rec-dot">● REC</span>}
          <span className="timer">⏱ {fmtElapsed}</span>
          <ThemeToggle />
        </div>
        {copied && <div className="toast">Invite link copied ✓</div>}
        {status === 'connecting' && <div className="toast">Connecting…</div>}
        {captionsOn && captionNote && <div className="toast">{captionNote}</div>}
      </header>

      {isOwner && waitingList.length > 0 && (
        <div className="knock-stack">
          <div className="knock-head">
            <span className="knock-head-title">
              <People /> Waiting to join
              <span className="knock-count">{waitingList.length}</span>
            </span>
            {waitingList.length > 1 && (
              <button className="knock-all" onClick={() => waitingList.forEach((u) => admit(u.id))}>
                Admit all
              </button>
            )}
          </div>
          {waitingList.map((u) => (
            <div key={u.id} className="knock-card">
              <div className="knock-info">
                <span className="knock-pic">{(u.name[0] || '?').toUpperCase()}</span>
                <div className="knock-text">
                  <strong>{u.name}</strong>
                  <span className="knock-sub">wants to join this call</span>
                </div>
              </div>
              <div className="knock-actions">
                <button className="knock-deny" onClick={() => deny(u.id)} title="Deny entry"><X /></button>
                <button className="knock-admit" onClick={() => admit(u.id)} title="Admit to call">
                  <Check /> Admit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <main className="stage">
        <div className="stage-inner">
          {peerList.map((p) => (
            <AudioSink key={`audio-${p.id}`} stream={p.stream} onBlocked={() => setAudioBlocked(true)} />
          ))}
          {audioBlocked && (
            <button className="audio-unlock" onClick={enableAudio}>🔊 Click to enable sound</button>
          )}
          <Reactions reactions={reactions} />
          {spotlightTile ? (
            <div className="spotlight-layout">
              <div className="spotlight-main">{spotlightTile}</div>
              {stripTiles.length > 0 && <div className="spotlight-strip">{stripTiles}</div>}
            </div>
          ) : (
            <div className="video-grid">{allTiles}</div>
          )}
        </div>

        {panel && (
          <aside className="panel">
            <div className="panel-tabs">
              <button className={`tab ${panel === 'chat' ? 'active' : ''}`} onClick={() => setPanel('chat')}>Chat</button>
              <button className={`tab ${panel === 'people' ? 'active' : ''}`} onClick={() => setPanel('people')}>
                People <span>{peopleForPanel.length}</span>
              </button>
              <button className="tab close" onClick={() => setPanel(null)}><X /></button>
            </div>
            {panel === 'chat'
              ? <ChatPanel messages={messages} onSend={sendChat} />
              : <PeoplePanel people={peopleForPanel} canModerate={isOwner} onRemove={removeParticipant} />}
          </aside>
        )}
      </main>

      <footer className="controls">
        <button className={`ctrl ${micOn ? '' : 'off'}`} onClick={toggleMic}>
          <span className="ic">{micOn ? <MicOn /> : <MicOff />}</span><span className="lbl">{micOn ? 'Mute' : 'Unmute'}</span>
        </button>
        <button className={`ctrl ${camOn ? '' : 'off'}`} onClick={toggleCam}>
          <span className="ic">{camOn ? <CamOn /> : <CamOff />}</span><span className="lbl">{camOn ? 'Stop' : 'Start'}</span>
        </button>
        <button className={`ctrl ${sharing ? 'active' : ''}`} onClick={toggleShare}>
          <span className="ic"><Screen /></span><span className="lbl">{sharing ? 'Stop' : 'Present'}</span>
        </button>

        <div className="ctrl-pop">
          <button className="ctrl" onClick={() => setEmojiOpen((v) => !v)}>
            <span className="ic"><Smile /></span><span className="lbl">React</span>
          </button>
          {emojiOpen && (
            <div className="emoji-bar">
              {EMOJIS.map((e) => <button key={e} onClick={() => react(e)}>{e}</button>)}
            </div>
          )}
        </div>

        <button className={`ctrl ${handRaised ? 'active' : ''}`} onClick={toggleHand}>
          <span className="ic"><Hand /></span><span className="lbl">Hand</span>
        </button>
        <button className={`ctrl ${captionsOn ? 'active' : ''}`} onClick={() => setCaptionsOn((v) => !v)}>
          <span className="ic"><Captions /></span><span className="lbl">Captions</span>
        </button>
        <button className={`ctrl ${recording ? 'off' : ''}`} onClick={toggleRecording}>
          <span className="ic"><Record /></span><span className="lbl">{recording ? 'Stop' : 'Record'}</span>
        </button>
        <button className={`ctrl ${panel === 'chat' ? 'active' : ''}`} onClick={() => setPanel(panel === 'chat' ? null : 'chat')}>
          <span className="ic"><Chat /></span><span className="lbl">Chat{unread ? ` ${unread}` : ''}</span>
        </button>
        <button className={`ctrl ${panel === 'people' ? 'active' : ''}`} onClick={() => setPanel(panel === 'people' ? null : 'people')}>
          <span className="ic"><People /></span><span className="lbl">People</span>
        </button>
        <button className="ctrl" onClick={toggleFullscreen}>
          <span className="ic">{fullscreen ? <Collapse /> : <Expand />}</span><span className="lbl">Screen</span>
        </button>
        <button className="ctrl" onClick={() => setSettingsOpen(true)}>
          <span className="ic"><Gear /></span><span className="lbl">Settings</span>
        </button>
        <button className="ctrl leave" onClick={leave} title={isOwner ? 'End meeting for all' : 'Leave'}>
          <span className="ic"><Phone /></span><span className="lbl">{isOwner ? 'End' : 'Leave'}</span>
        </button>
      </footer>

      {settingsOpen && (
        <SettingsModal
          current={{ camId: joinInfo.camId, micId: joinInfo.micId }}
          onCamera={switchCamera}
          onMic={switchMic}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
