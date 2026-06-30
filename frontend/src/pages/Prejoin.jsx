import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { listDevices } from '../lib/media';
import { MicOn, MicOff, CamOn, CamOff } from '../components/Icons';

function initials(name = '?') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
}

export default function Prejoin() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [name, setName] = useState(localStorage.getItem('mc_name') || '');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [devices, setDevices] = useState({ cameras: [], mics: [], speakers: [] });
  const [camId, setCamId] = useState('');
  const [micId, setMicId] = useState('');
  const [hasVideo, setHasVideo] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [notice, setNotice] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function acquire() {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const vWant = camId ? { deviceId: { exact: camId } } : true;
      const aWant = micId ? { deviceId: { exact: micId } } : true;
      const gUM = (c) => navigator.mediaDevices.getUserMedia(c);

      let stream = null;
      let firstErr = null;
      try {
        stream = await gUM({ video: vWant, audio: aWant });
      } catch (e1) {
        firstErr = e1;
        try { stream = await gUM({ audio: aWant }); } catch {
          try { stream = await gUM({ video: vWant }); } catch { stream = null; }
        }
      }
      if (!active) { stream?.getTracks().forEach((t) => t.stop()); return; }

      const vid = !!stream?.getVideoTracks().length;
      const aud = !!stream?.getAudioTracks().length;
      streamRef.current = stream;
      setHasVideo(vid);
      setHasAudio(aud);
      setCamOn((on) => on && vid);
      setMicOn((on) => on && aud);

      if (stream) {
        stream.getAudioTracks().forEach((t) => (t.enabled = aud));
        stream.getVideoTracks().forEach((t) => (t.enabled = vid));
        if (videoRef.current) videoRef.current.srcObject = stream;
        const d = await listDevices();
        if (active) setDevices(d);
      }

      if (!vid && !aud) {
        const t = firstErr?.name;
        setNotice({
          tone: 'warn',
          text:
            t === 'NotAllowedError'
              ? 'Camera & microphone are blocked. Click the 🔒/camera icon in the address bar, allow access, then Retry.'
              : t === 'NotFoundError'
                ? 'No camera or microphone found. You can still join to watch and chat.'
                : t === 'NotReadableError'
                  ? 'Your camera/mic is in use by another app (Zoom, Meet, etc.). Close it and Retry.'
                  : 'Could not access camera or microphone. You can still join to watch and chat.',
        });
      } else if (!vid) {
        setNotice({ tone: 'info', text: 'Camera unavailable — you’ll join with audio only.' });
      } else if (!aud) {
        setNotice({ tone: 'info', text: 'Microphone unavailable — you’ll join muted.' });
      } else {
        setNotice(null);
      }
    }
    acquire();
    return () => { active = false; };
  }, [camId, micId, retryKey]);

  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = micOn));
  }, [micOn]);
  useEffect(() => {
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = camOn));
  }, [camOn]);

  function joinNow() {
    const finalName = name.trim() || 'Guest';
    localStorage.setItem('mc_name', finalName);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    navigate(`/room/${encodeURIComponent(roomId)}`, {
      state: { name: finalName, micOn, camOn, camId, micId },
    });
  }

  const showVideo = hasVideo && camOn;

  return (
    <div className="prejoin">
      <header className="pj-brand">
        <span className="logo">◈</span>
        <span className="brand-name">Nexus Meet</span>
      </header>

      <div className="pj-main">
        <div className="pj-preview-col">
          <div className="pj-preview">
            <video ref={videoRef} autoPlay playsInline muted className={showVideo ? '' : 'hidden'} />
            {!showVideo && (
              <div className="pj-avatar">
                <div className="pj-avatar-circle">{initials(name || 'You')}</div>
                <span className="pj-avatar-label">{hasVideo ? 'Camera is off' : 'No camera'}</span>
              </div>
            )}
            <div className="pj-controls">
              <button
                className={`circle-btn ${!hasAudio ? 'na' : micOn ? '' : 'off'}`}
                onClick={() => hasAudio && setMicOn((v) => !v)}
                disabled={!hasAudio}
                title={hasAudio ? (micOn ? 'Mute' : 'Unmute') : 'No microphone'}
              >
                {hasAudio && micOn ? <MicOn /> : <MicOff />}
              </button>
              <button
                className={`circle-btn ${!hasVideo ? 'na' : camOn ? '' : 'off'}`}
                onClick={() => hasVideo && setCamOn((v) => !v)}
                disabled={!hasVideo}
                title={hasVideo ? (camOn ? 'Turn off camera' : 'Turn on camera') : 'No camera'}
              >
                {hasVideo && camOn ? <CamOn /> : <CamOff />}
              </button>
            </div>
          </div>

          <div className="pj-devices">
            <label className="pj-device">
              <span className="pj-device-ic"><MicOn /></span>
              <select value={micId} onChange={(e) => setMicId(e.target.value)} disabled={!devices.mics.length}>
                {devices.mics.length
                  ? devices.mics.map((m) => <option key={m.deviceId} value={m.deviceId}>{m.label || 'Microphone'}</option>)
                  : <option>No microphone</option>}
              </select>
            </label>
            <label className="pj-device">
              <span className="pj-device-ic"><CamOn /></span>
              <select value={camId} onChange={(e) => setCamId(e.target.value)} disabled={!devices.cameras.length}>
                {devices.cameras.length
                  ? devices.cameras.map((c) => <option key={c.deviceId} value={c.deviceId}>{c.label || 'Camera'}</option>)
                  : <option>No camera</option>}
              </select>
            </label>
          </div>
        </div>

        <div className="pj-join-col">
          <span className="pj-eyebrow">You're about to join</span>
          <h2>Ready to join?</h2>
          <div className="pj-code-chip">
            <span className="dot" /> {roomId}
          </div>

          <label className="pj-field">
            <span>Your name</span>
            <input
              className="pj-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && joinNow()}
              placeholder="Enter your name"
              maxLength={40}
            />
          </label>

          <button className="btn primary pj-btn" onClick={joinNow}>Join now</button>
          <button className="btn ghost pj-cancel" onClick={() => navigate('/')}>Cancel</button>

          {notice && (
            <div className={`pj-notice ${notice.tone}`}>
              <span>{notice.text}</span>
              {notice.tone === 'warn' && (
                <button className="pj-retry" onClick={() => setRetryKey((k) => k + 1)}>Retry</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
