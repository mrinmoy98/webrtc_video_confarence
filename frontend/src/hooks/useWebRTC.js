import { useCallback, useEffect, useRef, useState } from 'react';
import { createSocket } from '../lib/socket';
import { createAudioMeter, createRecorder } from '../lib/media';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];


export function useWebRTC(roomId, displayName, initial) {
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState({});
  const [messages, setMessages] = useState([]);
  const [micOn, setMicOn] = useState(initial.micOn);
  const [camOn, setCamOn] = useState(initial.camOn);
  const [sharing, setSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [status, setStatus] = useState('connecting');
  const [errorMsg, setErrorMsg] = useState('');
  const [endedReason, setEndedReason] = useState('');
  const [reactions, setReactions] = useState([]);
  const [captions, setCaptions] = useState({});
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [recording, setRecording] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [waitingList, setWaitingList] = useState([]);

  const socketRef = useRef(null);
  const pcsRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const screenStreamRef = useRef(null);
  const pendingCandidatesRef = useRef(new Map());
  const namesRef = useRef(new Map());
  const meterRef = useRef(null);
  const recorderRef = useRef(null);
  const reactionSeq = useRef(0);

  const upsertPeer = useCallback((id, patch) => {
    setPeers((prev) => ({ ...prev, [id]: { ...(prev[id] || { id }), ...patch } }));
  }, []);

  const patchPeer = useCallback((id, patch) => {
    setPeers((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], ...patch } } : prev));
  }, []);
  const removePeer = useCallback((id) => {
    setPeers((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const addSystemMessage = useCallback((text) => {
    setMessages((m) => [...m, { system: true, message: text, ts: Date.now(), id: `s${m.length}` }]);
  }, []);

  const createPeerConnection = useCallback((peerId) => {
    if (pcsRef.current.has(peerId)) return pcsRef.current.get(peerId);

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    const local = localStreamRef.current;
    if (local) local.getTracks().forEach((t) => pc.addTrack(t, local));

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit('ice-candidate', { to: peerId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      const [stream] = e.streams;
      upsertPeer(peerId, { stream, name: namesRef.current.get(peerId) || 'Guest' });
    };

    pc.onconnectionstatechange = () => {
      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
        if (pc.connectionState === 'failed') pc.restartIce?.();
      }
    };

    pcsRef.current.set(peerId, pc);
    return pc;
  }, [upsertPeer]);

  const flushPending = useCallback(async (peerId, pc) => {
    const queued = pendingCandidatesRef.current.get(peerId);
    if (queued?.length) {
      for (const c of queued) {
        try { await pc.addIceCandidate(c); } catch { /* ignore */ }
      }
      pendingCandidatesRef.current.delete(peerId);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const gUM = (c) => navigator.mediaDevices.getUserMedia(c);
      const vWant = { width: { ideal: 1280 }, height: { ideal: 720 } };
      const aWant = { echoCancellation: true, noiseSuppression: true };
      let stream = null;
      try {
        stream = await gUM({ video: vWant, audio: aWant });
      } catch {
        try { stream = await gUM({ audio: aWant }); } catch {
          try { stream = await gUM({ video: vWant }); } catch { stream = null; }
        }
      }
      if (cancelled) { stream?.getTracks().forEach((t) => t.stop()); return; }
      if (!stream) stream = new MediaStream();

      const hasAudio = stream.getAudioTracks().length > 0;
      const hasVideo = stream.getVideoTracks().length > 0;
      stream.getAudioTracks().forEach((t) => (t.enabled = initial.micOn));
      stream.getVideoTracks().forEach((t) => (t.enabled = initial.camOn));
      setMicOn(initial.micOn && hasAudio);
      setCamOn(initial.camOn && hasVideo);

      localStreamRef.current = stream;
      cameraTrackRef.current = stream.getVideoTracks()[0] || null;
      setLocalStream(stream);

      const socket = createSocket();
      socketRef.current = socket;

      socket.on('connect_error', () => {
        setErrorMsg('Cannot reach the signaling server. Is the backend running on :4000?');
        setStatus('error');
      });

      socket.on('unauthorized', ({ message }) => {
        setErrorMsg(message || 'Your session expired. Please sign in again.');
        setStatus('error');
      });

      socket.on('waiting', () => setStatus('waiting'));
      socket.on('admitted', () => { /* existing-users follows immediately */ });
      socket.on('role', ({ isOwner: owner }) => setIsOwner(!!owner));
      socket.on('join-request', ({ user }) => {
        setWaitingList((w) => (w.some((u) => u.id === user.id) ? w : [...w, user]));
      });
      socket.on('waiting-list', ({ users }) => setWaitingList(users || []));
      socket.on('denied', () => {
        setEndedReason('The host did not let you in.');
        setStatus('ended');
      });
      socket.on('removed', () => {
        setEndedReason('You were removed from the meeting by the host.');
        setStatus('ended');
      });
      socket.on('meeting-ended', ({ reason }) => {
        setEndedReason(reason || 'The meeting has ended.');
        setStatus('ended');/* still no permission */ 
      });

      socket.on('existing-users', async ({ users }) => {
        setStatus('connected');
        for (const u of users) {
          namesRef.current.set(u.id, u.name);
          upsertPeer(u.id, {
            name: u.name, muted: u.muted, cameraOff: u.cameraOff,
            handRaised: u.handRaised, sharingScreen: u.sharingScreen, owner: u.isOwner,
          });
          const pc = createPeerConnection(u.id);
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('offer', { to: u.id, sdp: offer });
          } catch { /* ignore */ }
        }
      });

      socket.on('user-joined', ({ user }) => {
        namesRef.current.set(user.id, user.name);
        upsertPeer(user.id, {
          name: user.name, muted: user.muted, cameraOff: user.cameraOff,
          handRaised: user.handRaised, sharingScreen: user.sharingScreen, owner: user.isOwner,
        });
        addSystemMessage(`${user.name} joined`);
      });

      socket.on('offer', async ({ from, sdp }) => {
        const pc = createPeerConnection(from);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          await flushPending(from, pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('answer', { to: from, sdp: answer });
        } catch { /* ignore */ }
      });

      socket.on('answer', async ({ from, sdp }) => {
        const pc = pcsRef.current.get(from);
        if (!pc) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          await flushPending(from, pc);
        } catch { /* ignore */ }
      });

      socket.on('ice-candidate', async ({ from, candidate }) => {
        const pc = pcsRef.current.get(from);
        const ice = new RTCIceCandidate(candidate);
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try { await pc.addIceCandidate(ice); } catch { /* ignore */ }
        } else {
          const list = pendingCandidatesRef.current.get(from) || [];
          list.push(ice);
          pendingCandidatesRef.current.set(from, list);/* still no permission */ 
        }
      });

      socket.on('user-left', ({ id }) => {
        const pc = pcsRef.current.get(id);
        if (pc) { pc.close(); pcsRef.current.delete(id); }
        const name = namesRef.current.get(id);
        namesRef.current.delete(id);
        removePeer(id);
        if (name) addSystemMessage(`${name} left`);
      });

      socket.on('chat-message', ({ from, name, message }) => {
        setMessages((m) => [
          ...m,
          { id: `${from}-${m.length}`, from, name, message, ts: Date.now() },
        ]);
      });

      socket.on('media-state', ({ id, muted, cameraOff }) => {
        patchPeer(id, { muted, cameraOff });
      });

      socket.on('hand-raise', ({ id, name, raised }) => {
        patchPeer(id, { handRaised: raised });
        if (raised) addSystemMessage(`✋ ${name} raised their hand`);
      });

      socket.on('screen-share', ({ id, on }) => {
        patchPeer(id, { sharingScreen: on });
      });

      socket.on('reaction', ({ id, name, emoji }) => {
        const key = `r${reactionSeq.current++}`;
        setReactions((rs) => [...rs, { key, id, name, emoji }]);
        setTimeout(() => setReactions((rs) => rs.filter((r) => r.key !== key)), 4000);
      });

      socket.on('caption', ({ id, name, text, final }) => {
        setCaptions((c) => ({ ...c, [id]: { name, text, ts: Date.now() } }));
        if (final) {
          setTimeout(() => {
            setCaptions((c) => {
              if (c[id] && Date.now() - c[id].ts >= 2500) {
                const next = { ...c };
                delete next[id];
                return next;
              }
              return c;
            });
          }, 3000);
        }
      });

      socket.emit('join-room', {
        roomId,
        name: displayName,
        muted: !initial.micOn,
        cameraOff: !initial.camOn,
        ownerKey: localStorage.getItem(`mc_owner_${roomId}`) || null,
      });
    }

    start();

    return () => {
      cancelled = true;
      socketRef.current?.emit('leave-room');
      socketRef.current?.disconnect();
      pcsRef.current.forEach((pc) => pc.close());
      pcsRef.current.clear();
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [roomId, displayName]);

  const applyOutgoingTrack = useCallback(async (track) => {
    const local = localStreamRef.current;
    local.getTracks().filter((t) => t.kind === track.kind).forEach((t) => {
      t.stop(); local.removeTrack(t);
    });
    local.addTrack(track);
    for (const [peerId, pc] of pcsRef.current) {
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === track.kind);
      if (sender) {
        sender.replaceTrack(track);
      } else {
        pc.addTrack(track, local);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketRef.current?.emit('offer', { to: peerId, sdp: offer });
        } catch { /* ignore */ }
      }
    }
    setLocalStream(new MediaStream(local.getTracks()));
  }, []);

  const toggleMic = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const tracks = stream.getAudioTracks();
    if (tracks.length) {
      const next = !micOn;
      tracks.forEach((t) => (t.enabled = next));
      setMicOn(next);
      socketRef.current?.emit('media-state', { muted: !next });
      return;
    }
    if (micOn) return;
    try {
      const ns = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      await applyOutgoingTrack(ns.getAudioTracks()[0]);
      meterRef.current?.detach('local');
      meterRef.current?.attach('local', localStreamRef.current);
      setMicOn(true);
      socketRef.current?.emit('media-state', { muted: false });
    } catch { /* still no permission */ }
  }, [micOn, applyOutgoingTrack]);

  const toggleCam = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const tracks = stream.getVideoTracks();
    if (tracks.length) {
      const next = !camOn;
      tracks.forEach((t) => (t.enabled = next));
      setCamOn(next);
      socketRef.current?.emit('media-state', { cameraOff: !next });
      return;
    }
    if (camOn) return;
    try {
      const ns = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } /* still no permission */ },
      });
      const track = ns.getVideoTracks()[0];
      cameraTrackRef.current = track;
      await applyOutgoingTrack(track);
      setCamOn(true);
      socketRef.current?.emit('media-state', { cameraOff: false });
    } catch { /* still no permission */ }
  }, [camOn, applyOutgoingTrack]);

  const toggleHand = useCallback(() => {
    const next = !handRaised;
    setHandRaised(next);
    socketRef.current?.emit('hand-raise', { raised: next });
  }, [handRaised]);

  const replaceVideoTrackEverywhere = useCallback((newTrack) => {
    pcsRef.current.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (sender) sender.replaceTrack(newTrack);
    });
  }, []);

  const startShare = useCallback(async () => {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 }, audio: false,
      });
      screenStreamRef.current = screen;
      const screenTrack = screen.getVideoTracks()[0];

      replaceVideoTrackEverywhere(screenTrack);

      const local = localStreamRef.current;
      const oldVideo = local.getVideoTracks()[0];
      if (oldVideo) local.removeTrack(oldVideo);
      local.addTrack(screenTrack);
      setLocalStream(new MediaStream(local.getTracks()));

      setSharing(true);
      socketRef.current?.emit('screen-share', { on: true });

      screenTrack.onended = () => stopShare();
    } catch {
    }
  }, [replaceVideoTrackEverywhere]);

  const stopShare = useCallback(() => {
    const cam = cameraTrackRef.current;
    if (cam) {
      replaceVideoTrackEverywhere(cam);
      const local = localStreamRef.current;
      const screenTrack = screenStreamRef.current?.getVideoTracks()[0];
      if (local && screenTrack) {
        local.removeTrack(screenTrack);
        local.addTrack(cam);
        cam.enabled = camOn;
        setLocalStream(new MediaStream(local.getTracks()));
      }
    }
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setSharing(false);
    socketRef.current?.emit('screen-share', { on: false });
  }, [camOn, replaceVideoTrackEverywhere]);

  const toggleShare = useCallback(() => {
    if (sharing) stopShare(); else startShare();
  }, [sharing, startShare, stopShare]);

  const sendChat = useCallback((text) => {
    const msg = text.trim();
    if (!msg) return;
    socketRef.current?.emit('chat-message', { message: msg });
  }, []);

  const sendReaction = useCallback((emoji) => {
    socketRef.current?.emit('reaction', { emoji });
  }, []);

  const sendCaption = useCallback((text, final) => {
    socketRef.current?.emit('caption', { text, final });
  }, []);

  const admit = useCallback((id) => {
    socketRef.current?.emit('admit', { id });
    setWaitingList((w) => w.filter((u) => u.id !== id));
  }, []);
  const deny = useCallback((id) => {
    socketRef.current?.emit('deny', { id });
    setWaitingList((w) => w.filter((u) => u.id !== id));
  }, []);
  const removeParticipant = useCallback((id) => {
    socketRef.current?.emit('remove-participant', { id });
  }, []);
  const endMeeting = useCallback(() => {
    socketRef.current?.emit('end-meeting');
  }, []);

  const switchCamera = useCallback(async (deviceId) => {
    try {
      const ns = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });
      const newTrack = ns.getVideoTracks()[0];
      newTrack.enabled = camOn;
      const local = localStreamRef.current;
      const oldTrack = local.getVideoTracks()[0];
      if (oldTrack) { local.removeTrack(oldTrack); oldTrack.stop(); }
      local.addTrack(newTrack);
      cameraTrackRef.current = newTrack;
      if (!sharing) replaceVideoTrackEverywhere(newTrack);
      setLocalStream(new MediaStream(local.getTracks()));
    } catch { /* ignore */ }
  }, [camOn, sharing, replaceVideoTrackEverywhere]);

  const switchMic = useCallback(async (deviceId) => {
    try {
      const ns = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: true },
      });
      const newTrack = ns.getAudioTracks()[0];
      newTrack.enabled = micOn;
      const local = localStreamRef.current;
      const oldTrack = local.getAudioTracks()[0];
      if (oldTrack) { local.removeTrack(oldTrack); oldTrack.stop(); }
      local.addTrack(newTrack);
      pcsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'audio');
        if (sender) sender.replaceTrack(newTrack);
      });
      meterRef.current?.detach('local');
      meterRef.current?.attach('local', local);
      setLocalStream(new MediaStream(local.getTracks()));
    } catch { /* ignore */ }
  }, [micOn]);

  const toggleRecording = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
      setRecording(false);
      return;
    }
    const videoStream = localStreamRef.current;
    if (!videoStream) return;
    const audioStreams = [
      localStreamRef.current,
      ...Object.values(peers).map((p) => p.stream).filter(Boolean),
    ];
    try {
      recorderRef.current = createRecorder(videoStream, audioStreams);
      setRecording(true);
    } catch { setRecording(false); }
  }, [peers]);

  useEffect(() => {
    if (!meterRef.current) meterRef.current = createAudioMeter();
    const m = meterRef.current;
    if (localStream) m.attach('local', localStream);
    Object.values(peers).forEach((p) => p.stream && m.attach(p.id, p.stream));
  }, [localStream, peers]);

  useEffect(() => {
    const interval = setInterval(() => {
      const m = meterRef.current;
      if (!m) return;
      const lv = m.levels();
      let best = null;
      let max = 0.09;
      for (const [id, v] of Object.entries(lv)) {
        if (v > max) { max = v; best = id; }
      }
      setActiveSpeaker((prev) => (prev === best ? prev : best));
    }, 300);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => () => meterRef.current?.close(), []);

  return {
    localStream, peers, messages,
    micOn, camOn, sharing, handRaised, status, errorMsg, endedReason,
    reactions, captions, activeSpeaker, recording,
    isOwner, waitingList,
    toggleMic, toggleCam, toggleShare, toggleHand, sendChat,
    sendReaction, sendCaption, switchCamera, switchMic, toggleRecording,
    admit, deny, removeParticipant, endMeeting,
  };
}
