import { useEffect, useRef, useState } from 'react';

function fmtTime(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ChatPanel({ messages, onSend }) {
  const [text, setText] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function submit(e) {
    e.preventDefault();                                                                                                                                                                                                                                                             
    if (!text.trim()) return;
    onSend(text);
    setText('');
  }

  return (
    <div className="panel-body">
      <div className="messages">
        {messages.length === 0 && <div className="msg system">No messages yet. Say hi 👋</div>}
        {messages.map((m) =>
          m.system ? (
            <div key={m.id} className="msg system">{m.message}</div>
          ) : (
            <div key={m.id} className="msg">
              <div className="meta">{m.name}<span className="time">{fmtTime(m.ts)}</span></div>
              <div className="body">{m.message}</div>
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>
      <form className="chat-form" onSubmit={submit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Send a message"
          maxLength={2000}
          autoComplete="off"
        />
        <button type="submit" className="btn primary small">Send</button>
      </form>
    </div>
  );
}
