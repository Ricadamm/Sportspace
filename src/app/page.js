'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CourtCard from '@/components/CourtCard';

const SPORTS = [
  { key: 'tennis', label: 'Tennis', emoji: '🎾' },
  { key: 'padel', label: 'Padel', emoji: '🏓' },
  { key: 'badminton', label: 'Badminton', emoji: '🏸' },
  { key: 'soccer', label: 'Soccer', emoji: '⚽' },
  { key: 'basketball', label: 'Basketball', emoji: '🏀' },
];

const STATS = [
  { num: '128+', label: 'Courts Available' },
  { num: '5', label: 'Sports Covered' },
  { num: '4.8★', label: 'Avg Rating' },
  { num: '2400+', label: 'Bookings Made' },
];

export default function HomePage() {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchCourts();
  }, []);

  async function fetchCourts() {
    try {
      const res = await fetch('/api/courts');
      const data = await res.json();
      setCourts((data.courts || []).slice(0, 6));
    } catch (_e) {
      setCourts([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchText) params.set('search', searchText);
    if (sportFilter) params.set('sport', sportFilter);
    router.push(`/browse?${params.toString()}`);
  }

  function handleSportClick(sport) {
    router.push(`/browse?sport=${sport}`);
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container-main" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(163, 230, 53, 0.1)',
            border: '1px solid rgba(163, 230, 53, 0.3)',
            borderRadius: '20px',
            padding: '4px 16px',
            fontSize: '0.8rem',
            color: 'var(--lime)',
            fontWeight: 600,
            marginBottom: '1.5rem',
            letterSpacing: '0.05em',
          }}>
            🏟 SPORTSPACE PLATFORM
          </div>

          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            color: 'var(--white)',
            lineHeight: 1.15,
            marginBottom: '1rem',
          }}>
            Find & Book the{' '}
            <span style={{ color: 'var(--lime)' }}>Perfect Court</span>
          </h1>

          <p style={{
            color: 'var(--muted)',
            fontSize: '1.1rem',
            maxWidth: '540px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.6,
          }}>
            Discover premium sports courts near you. Book instantly, play immediately.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            maxWidth: '680px',
            margin: '0 auto',
            background: 'var(--navy-mid)',
            border: '1px solid var(--navy-border)',
            borderRadius: '12px',
            padding: '12px',
          }}>
            <input
              type="text"
              placeholder="Court name or location..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ flex: '1 1 200px', minWidth: '160px' }}
            />
            <select
              value={sportFilter}
              onChange={e => setSportFilter(e.target.value)}
              style={{ flex: '0 0 160px' }}
            >
              <option value="">All Sports</option>
              {SPORTS.map(s => (
                <option key={s.key} value={s.key}>{s.emoji} {s.label}</option>
              ))}
            </select>
            <button type="submit" className="btn-lime" style={{ flex: '0 0 auto', whiteSpace: 'nowrap' }}>
              🔍 Search
            </button>
          </form>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '2rem 0' }}>
        <div className="container-main">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            {STATS.map((stat) => (
              <div key={stat.label} className="stat-card">
                <div className="stat-num">{stat.num}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by Sport */}
      <section style={{ padding: '2rem 0' }}>
        <div className="container-main">
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--white)' }}>
            Browse by Sport
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {SPORTS.map(s => (
              <button
                key={s.key}
                onClick={() => handleSportClick(s.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '24px',
                  background: 'var(--navy-mid)',
                  border: '1px solid var(--navy-border)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--blue-light)';
                  e.currentTarget.style.color = 'var(--blue-light)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--navy-border)';
                  e.currentTarget.style.color = 'var(--text)';
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{s.emoji}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courts */}
      <section style={{ padding: '2rem 0' }}>
        <div className="container-main">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 700, color: 'var(--white)' }}>
              Featured Courts
            </h2>
            <button
              onClick={() => router.push('/browse')}
              style={{ color: 'var(--blue-light)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
            >
              View all →
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
              Loading courts...
            </div>
          ) : courts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
              No courts available yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {courts.map(court => (
                <CourtCard key={court.id} court={court} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Owner CTA */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container-main">
          <div style={{
            background: 'linear-gradient(135deg, var(--navy-mid), var(--navy-card))',
            border: '1px solid var(--navy-border)',
            borderRadius: '16px',
            padding: '3rem 2rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: '-30%', right: '-10%', width: '40%', height: '160%',
              background: 'radial-gradient(ellipse at center, rgba(163,230,53,0.06) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--white)' }}>
              Own a Sports Facility?
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '1rem', marginBottom: '1.75rem', maxWidth: '500px', margin: '0 auto 1.75rem' }}>
              List your court — Free. Reach thousands of players looking for courts just like yours.
            </p>
            <button
              onClick={() => router.push('/register')}
              className="btn-lime"
              style={{ padding: '12px 28px', fontSize: '1rem' }}
            >
              List Your Court →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--navy-border)',
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--muted)',
        fontSize: '0.85rem',
      }}>
        <p>© 2024 SportSpace. All rights reserved.</p>
      </footer>
    </div>
  );
}
