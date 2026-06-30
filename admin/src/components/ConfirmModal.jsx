import { useEffect } from 'react';

export default function ConfirmModal({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  icon = '⚠️',
  danger = false,
  onConfirm,
  onCancel,
}) {
  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onMouseDown={onCancel}>
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className={`modal-icon ${danger ? 'danger' : ''}`}>{icon}</div>
        <h3 className="modal-title">{title}</h3>
        {message && <p className="modal-message">{message}</p>}
        <div className="modal-actions">
          <button className="btn ghost" onClick={onCancel}>{cancelLabel}</button>
          <button className={`btn ${danger ? 'danger-solid' : 'primary'}`} onClick={onConfirm} autoFocus>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
