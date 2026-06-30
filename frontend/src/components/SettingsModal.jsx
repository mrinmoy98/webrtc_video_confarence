import { useEffect, useState } from 'react';
import { listDevices } from '../lib/media';
import { MicOn, CamOn, Speaker, Gear, X } from './Icons';

export default function SettingsModal({ onClose, onCamera, onMic, current }) {
  const [devices, setDevices] = useState({ cameras: [], mics: [], speakers: [] });
  const [camId, setCamId] = useState(current.camId || '');
  const [micId, setMicId] = useState(current.micId || '');

  useEffect(() => { listDevices().then(setDevices); }, []);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3><Gear /> Settings</h3>
          <button className="tab close" onClick={onClose}><X /></button>
        </div>
        <div className="modal-body">
          <label className="setting">
            <span><MicOn /> Microphone</span>
            <select value={micId} onChange={(e) => { setMicId(e.target.value); onMic(e.target.value); }}>
              {devices.mics.map((m) => <option key={m.deviceId} value={m.deviceId}>{m.label || 'Microphone'}</option>)}
            </select>
          </label>
          <label className="setting">
            <span><CamOn /> Camera</span>
            <select value={camId} onChange={(e) => { setCamId(e.target.value); onCamera(e.target.value); }}>
              {devices.cameras.map((c) => <option key={c.deviceId} value={c.deviceId}>{c.label || 'Camera'}</option>)}
            </select>
          </label>
          {devices.speakers.length > 0 && (
            <label className="setting">
              <span><Speaker /> Speaker</span>
              <select disabled title="Per-element speaker routing varies by browser">
                {devices.speakers.map((s) => <option key={s.deviceId}>{s.label || 'Speaker'}</option>)}
              </select>
            </label>
          )}
          <p className="setting-note">Changes apply live to everyone in the call.</p>
        </div>
      </div>
    </div>
  );
}
