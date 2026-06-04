'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StatusPill from '@/components/StatusPill';

const SPORT_EMOJIS = { tennis: '🎾', padel: '🏓', badminton: '🏸', soccer: '⚽', basketball: '🏀' };
const SPORTS = ['tennis', 'padel', 'badminton', 'soccer', 'basketball'];

export default function OwnerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [courts, setCourts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('courts');
  const [loading, setLoading] = useState(true);

  // Add court form
  const [courtName, setCourtName] = useState('');
  const [courtSport, setCourtSport] = useState('badminton');
  const [courtDesc, setCourtDesc] = useState('');
  const [courtLocation, setCourtLocation] = useState('');
  const [courtCity, setCourtCity] = useState('');
  const [courtPrice, setCourtPrice] = useState('');
  const [courtIndoor, setCourtIndoor] = useState(false);
  const [courtUrl, setCourtUrl] = useState('');
  const [courtAmenities, setCourtAmenities] = useState('');
  const [addCourtMsg, setAddCourtMsg] = useState('');
  const [addCourtLoading, setAddCourtLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (!data.user || !['owner', 'admin'].includes(data.user.role)) {
      router.push('/login');
      return;
    }
    setUser(data.user);
    setOwnerInfo(data.user.owner_info || null);

    const [courtsRes, bookingsRes] = await Promise.all([
      fetch('/api/owner/courts'),
      fetch('/api/owner/bookings'),
    ]);
    const courtsData = await courtsRes.json();
    const bookingsData = await bookingsRes.json();
    setCourts(courtsData.courts || []);
    setBookings(bookingsData.bookings || []);
    setLoading(false);
  }

  async function handleBookingStatus(bookingId, status) {
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchData();
  }

  async function handleAddCourt(e) {
    e.preventDefault();
    setAddCourtMsg('');
    setAddCourtLoading(true);
    try {
      const amenitiesArr = courtAmenities.split(',').map(a => a.trim()).filter(Boolean);
      const res = await fetch('/api/owner/courts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: courtName,
          sport: courtSport,
          description: courtDesc,
          location: courtLocation,
          city: courtCity,
          price_per_hour: Number(courtPrice),
          is_indoor: courtIndoor,
          external_url: courtUrl,
          amenities: amenitiesArr,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAddCourtMsg(`Court added successfully! ID: #${data.court_id}`);
        setCourtName(''); setCourtSport('badminton'); setCourtDesc('');
        setCourtLocation(''); setCourtCity(''); setCourtPrice('');
        setCourtIndoor(false); setCourtUrl(''); setCourtAmenities('');
        fetchData();
      } else {
        setAddCourtMsg(data.error || 'Failed to add court.');
      }
    } catch (_e) {
      setAddCourtMsg('Error adding court.');
    } finally {
      setAddCourtLoading(false);
    }
  }

  if (!user) return null;

  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const totalRevenue = bookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + Number(b.total_price), 0);

  return (
    <div className="container-main" style={{ padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy-mid), var(--navy-card))',
        border: '1px solid var(--navy-border)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: '2.5rem' }}>🏢</div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--white)' }}>
              {ownerInfo?.business_name || user.full_name}
            </h1>
            {ownerInfo?.is_verified ? (
              <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(34,197,94,0.15)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.3)' }}>
                ✓ Verified
              </span>
            ) : (
              <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(245,158,11,0.15)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.3)' }}>
                ⏳ Pending
              </span>
            )}
          </div>
          {ownerInfo?.business_address && <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>📍 {ownerInfo.business_address}</p>}
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{user.email}</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
          <div className="kpi-card" style={{ padding: '0.75rem 1.25rem', minWidth: '80px', textAlign: 'center' }}>
            <div className="kpi-val" style={{ fontSize: '1.25rem' }}>{courts.length}</div>
            <div className="kpi-label">Courts</div>
          </div>
          <div className="kpi-card" style={{ padding: '0.75rem 1.25rem', minWidth: '80px', textAlign: 'center' }}>
            <div className="kpi-val" style={{ fontSize: '1.25rem', color: 'var(--lime)' }}>{bookings.length}</div>
            <div className="kpi-label">Bookings</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['courts', 'bookings', 'add-court', 'photos'].map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {{ courts: '🏟 My Courts', bookings: '📋 Bookings', 'add-court': '➕ Add Court', photos: '📸 Court Photos' }[tab]}
          </button>
        ))}
      </div>

      {/* My Courts Tab */}
      {activeTab === 'courts' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>Loading courts...</div>
          ) : courts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏟</div>
              <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>You haven&apos;t added any courts yet.</p>
              <button className="btn-lime" onClick={() => setActiveTab('add-court')}>Add Your First Court</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {courts.map(c => (
                <div key={c.id} style={{
                  background: 'var(--navy-card)', border: '1px solid var(--navy-border)',
                  borderRadius: '10px', padding: '1.25rem',
                  display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
                }}>
                  <span style={{ fontSize: '2rem' }}>{SPORT_EMOJIS[c.sport] || '🏟'}</span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--white)', marginBottom: '2px' }}>{c.name}</h3>
                    <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>📍 {c.location}, {c.city}</p>
                    {parseFloat(c.avg_rating) > 0 && (
                      <span style={{ color: 'var(--warning)', fontSize: '0.82rem' }}>★ {parseFloat(c.avg_rating).toFixed(1)} ({c.review_count})</span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="price-text" style={{ fontSize: '0.95rem' }}>Rp {Number(c.price_per_hour).toLocaleString('id-ID')}/hr</div>
                    <div style={{ fontSize: '0.78rem', color: c.is_active ? 'var(--success)' : 'var(--danger)', marginTop: '2px' }}>
                      {c.is_active ? '● Active' : '● Inactive'}
                    </div>
                  </div>
                  <button className="btn-outline" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => router.push(`/court/${c.id}`)}>
                    View →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total', val: bookings.length, color: 'var(--blue-light)' },
              { label: 'Confirmed', val: confirmedBookings, color: 'var(--success)' },
              { label: 'Pending', val: pendingBookings, color: 'var(--warning)' },
              { label: 'Net Revenue', val: `Rp ${totalRevenue.toLocaleString('id-ID')}`, color: 'var(--lime)' },
            ].map(k => (
              <div key={k.label} className="kpi-card">
                <div className="kpi-val" style={{ color: k.color, fontSize: '1.25rem' }}>{k.val}</div>
                <div className="kpi-label">{k.label}</div>
              </div>
            ))}
          </div>

          {bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', color: 'var(--muted)' }}>
              No bookings yet.
            </div>
          ) : (
            <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr>
                    <th>Court</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{b.court_name}</td>
                      <td>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text)' }}>{b.customer_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{b.customer_email}</div>
                      </td>
                      <td style={{ fontSize: '0.875rem' }}>{b.booking_date}</td>
                      <td style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{b.start_time} – {b.end_time}</td>
                      <td><StatusPill status={b.status} /></td>
                      <td style={{ fontSize: '0.875rem', color: 'var(--lime)', fontWeight: 600 }}>
                        Rp {Number(b.total_price).toLocaleString('id-ID')}
                      </td>
                      <td>
                        {b.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn-success" onClick={() => handleBookingStatus(b.id, 'confirmed')}>Confirm</button>
                            <button className="btn-danger" onClick={() => handleBookingStatus(b.id, 'cancelled')}>Cancel</button>
                          </div>
                        )}
                        {b.status === 'confirmed' && (
                          <button className="btn-danger" onClick={() => handleBookingStatus(b.id, 'cancelled')}>Cancel</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Court Tab */}
      {activeTab === 'add-court' && (
        <div style={{ maxWidth: '600px' }}>
          <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', padding: '1.75rem' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)', marginBottom: '1.5rem' }}>
              Add New Court
            </h2>
            <form onSubmit={handleAddCourt}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Court Name *</label>
                  <input type="text" value={courtName} onChange={e => setCourtName(e.target.value)} required placeholder="e.g. Court A - Lapangan Utama" />
                </div>
                <div>
                  <label>Sport *</label>
                  <select value={courtSport} onChange={e => setCourtSport(e.target.value)}>
                    {SPORTS.map(s => <option key={s} value={s}>{SPORT_EMOJIS[s]} {s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label>Price Per Hour (IDR) *</label>
                  <input type="number" value={courtPrice} onChange={e => setCourtPrice(e.target.value)} required placeholder="e.g. 150000" min="0" />
                </div>
                <div>
                  <label>Location *</label>
                  <input type="text" value={courtLocation} onChange={e => setCourtLocation(e.target.value)} required placeholder="Street address" />
                </div>
                <div>
                  <label>City *</label>
                  <input type="text" value={courtCity} onChange={e => setCourtCity(e.target.value)} required placeholder="e.g. Jakarta" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Description</label>
                  <textarea rows={3} value={courtDesc} onChange={e => setCourtDesc(e.target.value)} placeholder="Describe your court..." />
                </div>
                <div>
                  <label>External URL</label>
                  <input type="url" value={courtUrl} onChange={e => setCourtUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '1.5rem' }}>
                  <input
                    type="checkbox"
                    id="is_indoor"
                    checked={courtIndoor}
                    onChange={e => setCourtIndoor(e.target.checked)}
                    style={{ width: 'auto', accentColor: 'var(--blue)' }}
                  />
                  <label htmlFor="is_indoor" style={{ marginBottom: 0, textTransform: 'none', letterSpacing: 'normal', fontSize: '0.875rem', cursor: 'pointer' }}>
                    Indoor Court
                  </label>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Amenities (comma-separated)</label>
                  <input type="text" value={courtAmenities} onChange={e => setCourtAmenities(e.target.value)} placeholder="e.g. Parking, Shower, Cafe, Locker" />
                </div>
              </div>

              {addCourtMsg && (
                <div className={addCourtMsg.includes('!') ? 'alert-success' : 'alert-error'} style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
                  {addCourtMsg}
                </div>
              )}

              <button type="submit" className="btn-lime" style={{ marginTop: '1.25rem', padding: '10px 24px' }} disabled={addCourtLoading}>
                {addCourtLoading ? 'Adding...' : '➕ Add Court'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Photos Tab */}
      {activeTab === 'photos' && (
        <div style={{ maxWidth: '500px' }}>
          <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', padding: '1.75rem' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)', marginBottom: '1rem' }}>
              Court Photos
            </h2>
            <div style={{ marginBottom: '1rem' }}>
              <label>Select Court</label>
              <select>
                <option value="">— Select a court —</option>
                {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Upload Photo</label>
              <input type="file" accept="image/*" style={{ background: 'var(--navy-mid)', padding: '8px' }} />
            </div>
            <div className="alert-info" style={{ fontSize: '0.82rem' }}>
              Photo upload requires a court to be selected. Photos are stored server-side.
            </div>
            <button className="btn-primary" style={{ marginTop: '1rem' }}>Upload Photo</button>
          </div>
        </div>
      )}
    </div>
  );
}
