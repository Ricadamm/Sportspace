'use client';

import { useRouter } from 'next/navigation';

const SPORT_EMOJIS = {
  tennis: '🎾',
  padel: '🏓',
  badminton: '🏸',
  soccer: '⚽',
  basketball: '🏀',
};

const SPORT_BADGE_CLASS = {
  tennis: 'badge-tennis',
  padel: 'badge-padel',
  badminton: 'badge-badminton',
  soccer: 'badge-soccer',
  basketball: 'badge-basketball',
};

function StarRating({ rating }) {
  const r = parseFloat(rating) || 0;
  const full = Math.floor(r);
  const half = r % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <span style={{ color: 'var(--warning)', fontSize: '0.85rem' }}>
      {'★'.repeat(full)}
      {half ? '½' : ''}
      {'☆'.repeat(empty)}
    </span>
  );
}

export default function CourtCard({ court }) {
  const router = useRouter();
  const sport = court.sport?.toLowerCase() || '';
  const emoji = SPORT_EMOJIS[sport] || '🏟️';
  const badgeClass = SPORT_BADGE_CLASS[sport] || '';
  const avgRating = parseFloat(court.avg_rating) || 0;
  const reviewCount = court.review_count || 0;
  const priceFormatted = `Rp ${Number(court.price_per_hour).toLocaleString('id-ID')}`;

  return (
    <div className="court-card" style={{ cursor: 'pointer' }} onClick={() => router.push(`/court/${court.id}`)}>
      {/* Sport emoji header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '1.75rem' }}>{emoji}</span>
        <span className={`sport-badge ${badgeClass}`}>{sport}</span>
      </div>

      {/* Court name */}
      <h3 style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: '1rem',
        fontWeight: 700,
        color: 'var(--white)',
        marginBottom: '0.4rem',
        lineHeight: 1.3,
      }}>
        {court.name}
      </h3>

      {/* Location */}
      <p className="location-text" style={{ marginBottom: '0.5rem' }}>
        📍 {court.location}{court.city ? `, ${court.city}` : ''}
      </p>

      {/* Rating */}
      {avgRating > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
          <StarRating rating={avgRating} />
          <span className="rating-text">{avgRating.toFixed(1)}</span>
          <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>({reviewCount})</span>
        </div>
      )}

      {/* Indoor/Outdoor */}
      <div style={{ marginBottom: '0.75rem' }}>
        <span style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '0.72rem',
          fontWeight: 600,
          background: court.is_indoor ? 'rgba(59,130,246,0.15)' : 'rgba(34,197,94,0.1)',
          color: court.is_indoor ? 'var(--blue-light)' : 'var(--success)',
          border: court.is_indoor ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(34,197,94,0.2)',
        }}>
          {court.is_indoor ? '🏛 Indoor' : '🌿 Outdoor'}
        </span>
      </div>

      {/* Footer: price + button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
        <div>
          <span className="price-text">{priceFormatted}</span>
          <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>/hr</span>
        </div>
        <button
          className="btn-primary"
          style={{ padding: '5px 14px', fontSize: '0.8rem' }}
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/court/${court.id}`);
          }}
        >
          View Details →
        </button>
      </div>
    </div>
  );
}
