# MeetClone — WebRTC Video Conference (Google-Meet-style)

A peer-to-peer video meeting app built on top of the existing NestJS backend.

- **Backend** — NestJS + Socket.IO **signaling server** (`backend/src/meeting/`). It only
  relays WebRTC handshakes (SDP offers/answers + ICE). **No audio/video passes through the
  server** — media is fully peer-to-peer (mesh topology).
- **Frontend** — React (Vite) app in `frontend/`.

## Features (Google-Meet-style)

**App flow:** Home (landing) → Pre-join (preview + device select) → In-call.

### 👑 Host / owner controls (new)
- **Persistent owner** — whoever creates the meeting ("New meeting") gets an owner key
  saved in `localStorage` (`mc_owner_<room>`). They are the host every time they open that
  link, and reclaim host on refresh.
- **Waiting room** — anyone joining via the link waits until the host **admits** (or **denies**)
  them. The host sees live "knock" cards (Admit / Deny) top-right.
- **Remove participants** — host can kick anyone from the People panel (✕ button).
- **Host leaves → meeting ends for everyone** (with a ~12s grace window so a host refresh
  doesn't kill the call). The host's button reads **End** instead of **Leave**.
- Non-hosts who are denied/removed/ended see a friendly "you've left" screen with **Rejoin**.

- 🏠 **Home landing page** — "New meeting" (instant / create-for-later) + "Enter a code or link"
- 🎬 **Pre-join screen** — camera preview, mic/cam toggle, camera & mic device selection
- 🎥 Multi-party video & audio (mesh — best for **2–4 people**, see "Scaling" below)
- 🎙️ Mute / unmute mic, 📷 camera on/off (with avatar fallback)
- 🖥️ **Screen sharing** (auto-revert when you press the browser's "Stop sharing")
- 😀 **Reactions** — floating emojis broadcast to everyone
- 📌 **Pin / Spotlight** — click any tile to pin; presenter auto-spotlights
- 🟢 **Active-speaker highlight** — the talking person's tile glows (WebAudio level meter)
- 🔤 **Live captions** — browser Speech Recognition, broadcast to the room
- ⏺️ **Recording** — local recording (your video + everyone's mixed audio) → downloads `.webm`
- ⚙️ **In-call settings** — switch camera / mic live
- ⛶ **Fullscreen**, ⏱ **call timer**
- 💬 In-call **chat** (unread badge + join/leave system messages)
- ✋ **Raise hand**
- 👥 **Participants list** with live mic/cam/hand status
- 🔗 Shareable invite link (`Copy link`) + readable room codes
- ⌨️ Keyboard shortcuts: **M** = mic, **V** = camera

> **Browser note:** Live captions use the Web Speech API (best in Chrome/Edge).
> Recording uses `MediaRecorder` (Chrome/Edge/Firefox).

## Prerequisites

- Node.js (you have v22) and npm
- The backend's MongoDB Atlas URL is already in `backend/.env` (used by the CMS part,
  not by the meeting feature).

## Run it (development)

Open **two terminals**.

**1. Backend (signaling on :4000)**
```bash
cd backend
npm run start:dev
```

**2. Frontend (Vite on :5173)**
```bash
cd frontend
npm install      # first time only
npm run dev
```

Then open **http://localhost:5173** in your browser. To test a real call, open it in a
**second tab / browser / device**, enter the **same meeting code**, and join.

> 📷 `getUserMedia` (camera/mic) only works on `localhost` or HTTPS. `localhost` is fine.
> On other devices on your LAN you'll need HTTPS — see "Production" below.

## Run it (production, single server)

Build the React app; NestJS then serves it from `frontend/dist`:
```bash
cd frontend && npm run build
cd ../backend && npm run build && npm run start:prod
```
The UI is served at **http://localhost:4000/** (same origin → no CORS, `VITE_SIGNAL_URL`
should be left empty for this mode — rebuild the frontend after clearing it).

> ⚠️ Deep-linking/refreshing on `/room/xxx` under the NestJS static server needs an SPA
> fallback route. In dev (Vite) this already works. For prod, add a catch-all that returns
> `frontend/dist/index.html`, or just always enter rooms from the lobby.

## Scaling beyond ~4 people (important)

This is a **mesh**: each person sends their video to every other person, so upstream
bandwidth grows with participant count. Great for small calls, but for large meetings
you need an **SFU** (media server). Two upgrade paths, both reuse this same UI:

1. **LiveKit** (recommended) — open-source SFU + React SDK. Swap `useWebRTC.js` for the
   LiveKit client; keep the lobby/controls.
2. **mediasoup** — self-hosted SFU; more control, more ops work.

## NAT / firewall note (TURN)

`useWebRTC.js` uses public Google **STUN** servers — enough for most home/office networks.
Users behind strict/symmetric NATs need a **TURN** server (e.g. self-hosted `coturn`).
Add its credentials to `ICE_SERVERS` in `frontend/src/hooks/useWebRTC.js`.

## File map

```
backend/src/meeting/
  meeting.gateway.ts   # Socket.IO gateway: rooms + signaling relay + chat/hand/screen
  meeting.module.ts
backend/src/main.ts    # serves frontend/dist (static)
backend/src/app.module.ts  # registers MeetingModule

frontend/src/
  pages/Home.jsx         # Google-Meet-style landing (new meeting / enter code)
  pages/Prejoin.jsx      # preview + camera/mic device selection
  pages/Room.jsx         # call screen (grid/spotlight + controls + panels)
  hooks/useWebRTC.js     # the mesh: peer connections, tracks, screen share,
                         #   reactions, captions, device switch, recording, active speaker
  lib/socket.js          # Socket.IO connection to /meet
  lib/media.js           # device enumeration, audio meter, recorder
  components/VideoTile.jsx
  components/ChatPanel.jsx
  components/PeoplePanel.jsx
  components/Reactions.jsx
  components/SettingsModal.jsx
  components/Icons.jsx        # crisp inline-SVG control-bar icons
```

## Owner model (how "host" is decided)

There is no login, so ownership is by **possession of an owner key**:
1. Clicking **New meeting** mints a random key → `localStorage["mc_owner_<room>"]`.
2. On join, the client sends that key; the server marks the room's `ownerKey` on first claim.
3. Same key on reconnect ⇒ reclaim host (survives refresh). Everyone else waits for admission.

This is deliberately simple. For real auth-backed ownership, tie the owner key to your
existing admin JWT / a `Meeting` MongoDB document instead of `localStorage`.

## What still needs an SFU / server work (next steps)

These aren't in the mesh build and genuinely need a media server or more backend:
- **Server-side recording** of the whole meeting (current recording is client-side/local)
- **Breakout rooms**, **host moderation** (mute-others, remove, lock, waiting room/"Ask to join")
- **Live captions for 20+ people** reliably, **noise cancellation**, **background blur** at scale
- **Calendar scheduling** integration

Recommended: adopt **LiveKit** — keep this exact UI, swap `hooks/useWebRTC.js` for the LiveKit client.

## The original bug (fixed)

The backend crashed with `Cannot find module '.../bcrypt/lib/binding/napi-v3/bcrypt_lib.node'`
because the native `bcrypt` binary was never compiled for Node 22. Fixed by switching to
**`bcryptjs`** (pure JS, no native build, hash-compatible) in
`backend/src/admin/auth/auth.service.ts`.
```
