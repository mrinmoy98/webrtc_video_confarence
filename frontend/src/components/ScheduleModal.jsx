import { useState } from 'react';

// Default to the next round half-hour.
function defaultDateTime() {
  const d = new Date(Date.now() + 30 * 60000);
  d.setMinutes(d.getMinutes() < 30 ? 30 : 0, 0, 0);
  if (d.getMinutes() === 0) d.setHours(d.getHours() + 1);
  const pad = (n) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export default function ScheduleModal({ onClose, onCreate }) {
  const init = defaultDateTime();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(init.date);
  const [time, setTime] = useState(init.time);
  const [duration, setDuration] = useState(60);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    const scheduledAt = new Date(`${date}T${time}`);
    if (isNaN(scheduledAt.getTime())) { setError('Please pick a valid date and time.'); return; }
    if (scheduledAt.getTime() < Date.now() - 60000) { setError('That time is in the past.'); return; }

    setBusy(true);
    try {
      await onCreate({
        title: title.trim(),
        scheduledAt: scheduledAt.toISOString(),
        durationMins: Number(duration) || 60,
        description: description.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Could not schedule the meeting.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal sched-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>🗓️ Schedule a meeting</h3>
          <button className="tab close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-body sched-form" onSubmit={submit}>
          <label className="sched-field">
            <span>Title</span>
            <input value={title} required autoFocus maxLength={80}
              onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekly team sync" />
          </label>

          <div className="sched-row">
            <label className="sched-field">
              <span>Date</span>
              <input type="date" value={date} required onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="sched-field">
              <span>Time</span>
              <input type="time" value={time} required onChange={(e) => setTime(e.target.value)} />
            </label>
            <label className="sched-field">
              <span>Duration</span>
              <select value={duration} onChange={(e) => setDuration(e.target.value)}>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </label>
          </div>

          <label className="sched-field">
            <span>Description <em>(optional)</em></span>
            <textarea value={description} rows={3} maxLength={500}
              onChange={(e) => setDescription(e.target.value)} placeholder="Agenda or notes…" />
          </label>

          {error && <div className="sched-error">{error}</div>}

          <div className="sched-actions">
            <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary" disabled={busy}>
              {busy ? 'Scheduling…' : 'Schedule meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
