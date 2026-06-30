export async function listDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
      cameras: devices.filter((d) => d.kind === 'videoinput'),
      mics: devices.filter((d) => d.kind === 'audioinput'),
      speakers: devices.filter((d) => d.kind === 'audiooutput'),
    };
  } catch {
    return { cameras: [], mics: [], speakers: [] };
  }
}


export function createAudioMeter() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  const nodes = new Map();

  function attach(id, stream) {
    if (!stream || nodes.has(id)) return;
    const audioTracks = stream.getAudioTracks();
    if (!audioTracks.length) return;
    try {
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      nodes.set(id, { source, analyser, data: new Uint8Array(analyser.frequencyBinCount) });
    } catch { /* stream may have no audio */ }
  }

  function detach(id) {
    const n = nodes.get(id);
    if (n) { try { n.source.disconnect(); } catch {} nodes.delete(id); }
  }

  function levels() {
    const out = {};
    nodes.forEach((n, id) => {
      n.analyser.getByteFrequencyData(n.data);
      let sum = 0;
      for (let i = 0; i < n.data.length; i++) sum += n.data[i] * n.data[i];
      out[id] = Math.sqrt(sum / n.data.length) / 255;
    });
    return out;
  }

  function close() {
    nodes.forEach((_, id) => detach(id));
    try { ctx.close(); } catch {}
  }

  return { ctx, attach, detach, levels, close };
}

export function createRecorder(videoStream, audioStreams) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  const dest = ctx.createMediaStreamDestination();
  audioStreams.forEach((s) => {
    if (s && s.getAudioTracks().length) {
      try { ctx.createMediaStreamSource(s).connect(dest); } catch {}
    }
  });

  const mixed = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
    ? 'video/webm;codecs=vp9,opus'
    : 'video/webm';
  const recorder = new MediaRecorder(mixed, { mimeType: mime });
  const chunks = [];
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };

  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.webm`;
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); ctx.close(); }, 1000);
  };

  recorder.start();
  return recorder;
}
