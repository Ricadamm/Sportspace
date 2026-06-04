export default function StatusPill({ status }) {
  const s = (status || '').toLowerCase();

  const pillClass =
    s === 'confirmed' ? 'pill-confirmed' :
    s === 'cancelled' ? 'pill-cancelled' :
    'pill-pending';

  const label =
    s === 'confirmed' ? '✓ Confirmed' :
    s === 'cancelled' ? '✕ Cancelled' :
    '⏳ Pending';

  return <span className={pillClass}>{label}</span>;
}
