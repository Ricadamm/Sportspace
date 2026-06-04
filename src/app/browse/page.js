'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import CourtCard from '@/components/CourtCard';

const SPORTS = [
  { key: '', label: 'All Sports' },
  { key: 'tennis', label: '🎾 Tennis' },
  { key: 'padel', label: '🏓 Padel' },
  { key: 'badminton', label: '🏸 Badminton' },
  { key: 'soccer', label: '⚽ Soccer' },
  { key: 'basketball', label: '🏀 Basketball' },
];

function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [courts, setCourts] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sport, setSport] = useState(searchParams.get('sport') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [maxPrice, setMaxPrice] = useState(500000);

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    fetchCourts();
  }, [sport, city, search, maxPrice]);

  async function fetchCities() {
    try {
      const res = await fetch('/api/courts/cities');
      const data = await res.json();
      setCities(data.cities || []);
    } catch (_e) {
      setCities([]);
    }
  }

  async function fetchCourts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sport) params.set('sport', sport);
      if (city) params.set('city', city);
      if (search) params.set('search', search);
      if (maxPrice < 500000) params.set('max_price', maxPrice);

      const res = await fetch(`/api/courts?${params.toString()}`);
      const data = await res.json();
      setCourts(data.courts || []);
    } catch (_e) {
      setCourts([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    fetchCourts();
  }

  return (
    <div className="container-main" style={{ padding: '2rem 1.5rem' }}>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--white)' }}>
        Browse Courts
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Sidebar Filters */}
        <div style={{
          background: 'var(--navy-card)',
          border: '1px solid var(--navy-border)',
          borderRadius: '12px',
          padding: '1.5rem',
          position: 'sticky',
          top: '80px',
        }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--white)' }}>
            Filters
          </h3>

          <form onSubmit={handleSearchSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label>Search</label>
              <input
                type="text"
                placeholder="Court name or location..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label>Sport</label>
              <select value={sport} onChange={e => setSport(e.target.value)}>
                {SPORTS.map(s => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label>City</label>
              <select value={city} onChange={e => setCity(e.target.value)}>
                <option value="">All Cities</option>
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label>Max Price: Rp {Number(maxPrice).toLocaleString('id-ID')}/hr</label>
              <input
                type="range"
                min={50000}
                max={500000}
                step={10000}
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: 'var(--blue)',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '0.75rem', marginTop: '4px' }}>
                <span>Rp 50k</span>
                <span>Rp 500k</span>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              Apply Filters
            </button>

            <button
              type="button"
              className="btn-outline"
              style={{ width: '100%', marginTop: '8px' }}
              onClick={() => { setSport(''); setCity(''); setSearch(''); setMaxPrice(500000); }}
            >
              Clear All
            </button>
          </form>
        </div>

        {/* Court List */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
              {loading ? 'Loading...' : `${courts.length} court${courts.length !== 1 ? 's' : ''} found`}
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}>
              Loading courts...
            </div>
          ) : courts.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem',
              background: 'var(--navy-card)',
              border: '1px solid var(--navy-border)',
              borderRadius: '12px',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏟</div>
              <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>No courts found matching your filters.</p>
              <button className="btn-primary" onClick={() => { setSport(''); setCity(''); setSearch(''); setMaxPrice(500000); }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {courts.map(court => (
                <div key={court.id} style={{
                  background: 'var(--navy-card)',
                  border: '1px solid var(--navy-border)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr auto',
                  gap: '1rem',
                  alignItems: 'center',
                  transition: 'border-color 0.2s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue-light)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--navy-border)'}
                  onClick={() => router.push(`/court/${court.id}`)}
                >
                  {/* Sport icon */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem' }}>
                      {{ tennis: '🎾', padel: '🏓', badminton: '🏸', soccer: '⚽', basketball: '🏀' }[court.sport] || '🏟'}
                    </div>
                    <span className={`sport-badge badge-${court.sport}`} style={{ fontSize: '0.65rem', marginTop: '4px' }}>
                      {court.sport}
                    </span>
                  </div>

                  {/* Details */}
                  <div>
                    <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: 'var(--white)', marginBottom: '4px' }}>
                      {court.name}
                    </h3>
                    <p className="location-text" style={{ marginBottom: '6px' }}>
                      📍 {court.location}{court.city ? `, ${court.city}` : ''}
                    </p>
                    {parseFloat(court.avg_rating) > 0 && (
                      <span className="rating-text" style={{ marginRight: '8px' }}>
                        ★ {parseFloat(court.avg_rating).toFixed(1)} ({court.review_count})
                      </span>
                    )}
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      background: court.is_indoor ? 'rgba(59,130,246,0.15)' : 'rgba(34,197,94,0.1)',
                      color: court.is_indoor ? 'var(--blue-light)' : 'var(--success)',
                    }}>
                      {court.is_indoor ? '🏛 Indoor' : '🌿 Outdoor'}
                    </span>
                    {court.description && (
                      <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: '6px', lineHeight: 1.4 }}>
                        {court.description.slice(0, 100)}{court.description.length > 100 ? '...' : ''}
                      </p>
                    )}
                  </div>

                  {/* Price + Button */}
                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <div className="price-text" style={{ fontSize: '1rem', marginBottom: '4px' }}>
                      Rp {Number(court.price_per_hour).toLocaleString('id-ID')}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginBottom: '12px' }}>/hr</div>
                    <button
                      className="btn-primary"
                      style={{ padding: '6px 16px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                      onClick={e => { e.stopPropagation(); router.push(`/court/${court.id}`); }}
                    >
                      View & Book
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>}>
      <BrowseContent />
    </Suspense>
  );
}
