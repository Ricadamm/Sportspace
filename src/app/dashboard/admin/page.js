'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StatusPill from '@/components/StatusPill';

const SPORT_EMOJIS = { tennis: '🎾', padel: '🏓', badminton: '🏸', soccer: '⚽', basketball: '🏀' };

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [kpi, setKpi] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBiz, setSelectedBiz] = useState(null);
  const [bizData, setBizData] = useState(null);
  const [bizLoading, setBizLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('products');

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (!data.user || data.user.role !== 'admin') {
      router.push('/login');
      return;
    }
    setUser(data.user);
    fetchKpi();
    fetchBusinesses();
  }

  async function fetchKpi() {
    try {
      const res = await fetch('/api/admin/kpi');
      const data = await res.json();
      setKpi(data);
    } catch (_e) {}
  }

  async function fetchBusinesses() {
    try {
      const res = await fetch('/api/admin/businesses');
      const data = await res.json();
      setBusinesses(data.businesses || []);
    } catch (_e) {}
  }

  async function selectBusiness(biz) {
    setSelectedBiz(biz);
    setBizData(null);
    setBizLoading(true);
    setActiveTab('products');
    try {
      const res = await fetch(`/api/admin/businesses/${biz.business_db_name}`);
      const data = await res.json();
      if (res.ok) setBizData(data);
      else setBizData({ error: data.error });
    } catch (_e) {
      setBizData({ error: 'Failed to load business data.' });
    } finally {
      setBizLoading(false);
    }
  }

  async function handleOrderStatus(orderId, status) {
    if (!selectedBiz) return;
    const res = await fetch(`/api/admin/businesses/${selectedBiz.business_db_name}/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) selectBusiness(selectedBiz);
  }

  if (!user) return null;

  return (
    <div className="container-main" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
        <span style={{ fontSize: '2rem' }}>🛠️</span>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--white)' }}>
            Admin Dashboard
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Platform management & business oversight</p>
        </div>
      </div>

      {/* Platform KPIs */}
      {kpi && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '2rem' }}>
          {[
            { label: 'Total Businesses', val: kpi.total_businesses, emoji: '🏢', color: 'var(--blue-light)' },
            { label: 'Active Courts', val: kpi.active_courts, emoji: '🏟', color: 'var(--lime)' },
            { label: 'Total Customers', val: kpi.total_customers, emoji: '👥', color: 'var(--success)' },
            { label: 'Total Bookings', val: kpi.total_bookings, emoji: '📋', color: 'var(--warning)' },
            { label: 'Platform Revenue', val: `Rp ${Number(kpi.platform_revenue).toLocaleString('id-ID')}`, emoji: '💰', color: 'var(--lime)' },
          ].map(k => (
            <div key={k.label} className="kpi-card">
              <div className="kpi-icon">{k.emoji}</div>
              <div className="kpi-val" style={{ color: k.color, fontSize: '1.4rem' }}>{k.val}</div>
              <div className="kpi-label">{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Business Selector */}
      <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--white)', marginBottom: '1rem' }}>
          Select Business
        </h2>
        <select
          onChange={e => {
            const biz = businesses.find(b => b.business_db_name === e.target.value);
            if (biz) selectBusiness(biz);
          }}
          value={selectedBiz?.business_db_name || ''}
          style={{ maxWidth: '400px' }}
        >
          <option value="">— Select a business —</option>
          {businesses.map(b => (
            <option key={b.id} value={b.business_db_name}>
              {b.business_name} ({b.owner_name})
            </option>
          ))}
        </select>
      </div>

      {/* Selected Business Info */}
      {selectedBiz && (
        <div className="biz-box" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)' }}>
                  {selectedBiz.business_name}
                </h2>
                {selectedBiz.is_verified ? (
                  <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(34,197,94,0.15)', color: 'var(--success)' }}>✓ Verified</span>
                ) : (
                  <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(245,158,11,0.15)', color: 'var(--warning)' }}>Unverified</span>
                )}
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>👤 Owner: {selectedBiz.owner_name} ({selectedBiz.owner_email})</p>
              {selectedBiz.business_address && <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>📍 {selectedBiz.business_address}</p>}
              <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '4px' }}>DB: <code style={{ color: 'var(--blue-light)' }}>{selectedBiz.business_db_name}</code></p>
            </div>
            {bizData && !bizData.error && (
              <div style={{ display: 'flex', gap: '12px' }}>
                {[
                  { label: 'Courts', val: bizData.products?.length || 0 },
                  { label: 'Orders', val: bizData.orders?.length || 0 },
                  { label: 'Net Revenue', val: `Rp ${Number(bizData.summary?.total_net || 0).toLocaleString('id-ID')}` },
                ].map(k => (
                  <div key={k.label} style={{ textAlign: 'center', padding: '8px 16px', background: 'var(--navy-card)', borderRadius: '8px', border: '1px solid var(--navy-border)' }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--lime)', fontSize: '1rem' }}>{k.val}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>{k.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Business Data Tabs */}
      {selectedBiz && (
        <div>
          {bizLoading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>Loading business data...</div>
          )}

          {bizData?.error && (
            <div className="alert-error">{bizData.error}</div>
          )}

          {bizData && !bizData.error && (
            <>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {['products', 'orders', 'customers', 'revenue'].map(tab => (
                  <button
                    key={tab}
                    className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {{ products: '🏟 Products', orders: '📋 Orders', customers: '👥 Customers', revenue: '💰 Revenue' }[tab]}
                  </button>
                ))}
              </div>

              {/* Products */}
              {activeTab === 'products' && (
                <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', overflow: 'hidden' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Court</th>
                        <th>Sport</th>
                        <th>Location</th>
                        <th>Price/hr</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(bizData.products || []).map(p => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</td>
                          <td>
                            <span className={`sport-badge badge-${p.sport}`}>{SPORT_EMOJIS[p.sport]} {p.sport}</span>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{p.location}</td>
                          <td style={{ color: 'var(--lime)', fontWeight: 600, fontSize: '0.875rem' }}>Rp {Number(p.price_per_hour).toLocaleString('id-ID')}</td>
                          <td style={{ fontSize: '0.82rem' }}>{p.is_indoor ? '🏛 Indoor' : '🌿 Outdoor'}</td>
                          <td>
                            <span style={{ color: p.is_active ? 'var(--success)' : 'var(--danger)', fontSize: '0.82rem', fontWeight: 600 }}>
                              {p.is_active ? '● Active' : '● Inactive'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--warning)' }}>
                            {parseFloat(p.avg_rating) > 0 ? `★ ${parseFloat(p.avg_rating).toFixed(1)}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(!bizData.products || bizData.products.length === 0) && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>No products found.</div>
                  )}
                </div>
              )}

              {/* Orders */}
              {activeTab === 'orders' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '1rem' }}>
                    {[
                      { label: 'Total Orders', val: (bizData.orders || []).length, color: 'var(--blue-light)' },
                      { label: 'Confirmed', val: (bizData.orders || []).filter(o => o.status === 'confirmed').length, color: 'var(--success)' },
                      { label: 'Pending', val: (bizData.orders || []).filter(o => o.status === 'pending').length, color: 'var(--warning)' },
                      { label: 'Cancelled', val: (bizData.orders || []).filter(o => o.status === 'cancelled').length, color: 'var(--danger)' },
                    ].map(k => (
                      <div key={k.label} className="kpi-card">
                        <div className="kpi-val" style={{ color: k.color, fontSize: '1.25rem' }}>{k.val}</div>
                        <div className="kpi-label">{k.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', overflow: 'hidden' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>#ID</th>
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
                        {(bizData.orders || []).map(o => (
                          <tr key={o.id}>
                            <td style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>#{o.id}</td>
                            <td style={{ fontSize: '0.875rem', fontWeight: 600 }}>{o.product_name || '—'}</td>
                            <td>
                              <div style={{ fontSize: '0.82rem' }}>{o.customer_name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{o.customer_email}</div>
                            </td>
                            <td style={{ fontSize: '0.82rem' }}>{o.booking_date instanceof Date ? o.booking_date.toISOString().split('T')[0] : String(o.booking_date || '').slice(0, 10)}</td>
                            <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                              {typeof o.start_time === 'object' && o.start_time !== null
                                ? `${String(o.start_time.hours ?? 0).padStart(2, '0')}:${String(o.start_time.minutes ?? 0).padStart(2, '0')}`
                                : String(o.start_time || '').slice(0, 5)}
                            </td>
                            <td><StatusPill status={o.status} /></td>
                            <td style={{ fontSize: '0.82rem', color: 'var(--lime)', fontWeight: 600 }}>
                              Rp {Number(o.total_price).toLocaleString('id-ID')}
                            </td>
                            <td>
                              {o.status === 'pending' && (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button className="btn-success" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => handleOrderStatus(o.id, 'confirmed')}>✓</button>
                                  <button className="btn-danger" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => handleOrderStatus(o.id, 'cancelled')}>✕</button>
                                </div>
                              )}
                              {o.status === 'confirmed' && (
                                <button className="btn-danger" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => handleOrderStatus(o.id, 'cancelled')}>Cancel</button>
                              )}
                              {o.status === 'cancelled' && (
                                <button className="btn-outline" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => handleOrderStatus(o.id, 'pending')}>Revert</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Customers */}
              {activeTab === 'customers' && (
                <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', overflow: 'hidden' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Bookings</th>
                        <th>Total Spent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(bizData.customers || []).map(c => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.full_name}</td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{c.email}</td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{c.phone || '—'}</td>
                          <td style={{ fontSize: '0.875rem' }}>{c.total_bookings}</td>
                          <td style={{ fontSize: '0.875rem', color: 'var(--lime)', fontWeight: 600 }}>
                            Rp {Number(c.total_spent || 0).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(!bizData.customers || bizData.customers.length === 0) && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>No customers found.</div>
                  )}
                </div>
              )}

              {/* Revenue */}
              {activeTab === 'revenue' && (
                <div>
                  {bizData.summary && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '1.25rem' }}>
                      {[
                        { label: 'Gross Revenue', val: `Rp ${Number(bizData.summary.total_gross || 0).toLocaleString('id-ID')}`, color: 'var(--blue-light)' },
                        { label: 'Cancelled Revenue', val: `Rp ${Number(bizData.summary.total_cancelled || 0).toLocaleString('id-ID')}`, color: 'var(--danger)' },
                        { label: 'Net Revenue', val: `Rp ${Number(bizData.summary.total_net || 0).toLocaleString('id-ID')}`, color: 'var(--lime)' },
                      ].map(k => (
                        <div key={k.label} className="kpi-card">
                          <div className="kpi-val" style={{ color: k.color, fontSize: '1.1rem' }}>{k.val}</div>
                          <div className="kpi-label">{k.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', overflow: 'hidden' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Gross Revenue</th>
                          <th>Cancelled</th>
                          <th>Net Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(bizData.revenue || []).map((r, i) => (
                          <tr key={i}>
                            <td style={{ fontSize: '0.875rem' }}>
                              {r.revenue_date instanceof Date ? r.revenue_date.toISOString().split('T')[0] : String(r.revenue_date || '').slice(0, 10)}
                            </td>
                            <td style={{ fontSize: '0.875rem', color: 'var(--blue-light)', fontWeight: 600 }}>Rp {Number(r.gross_revenue || 0).toLocaleString('id-ID')}</td>
                            <td style={{ fontSize: '0.875rem', color: 'var(--danger)', fontWeight: 600 }}>Rp {Number(r.cancelled_revenue || 0).toLocaleString('id-ID')}</td>
                            <td style={{ fontSize: '0.875rem', color: 'var(--lime)', fontWeight: 600 }}>Rp {Number(r.net_revenue || 0).toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(!bizData.revenue || bizData.revenue.length === 0) && (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>No revenue data.</div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* All Businesses Overview */}
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)', marginBottom: '1rem' }}>
          All Businesses Overview
        </h2>
        <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Business</th>
                <th>Owner</th>
                <th>Courts</th>
                <th>Bookings</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map(b => (
                <tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => selectBusiness(b)}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--white)' }}>{b.business_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{b.business_db_name}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem' }}>{b.owner_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{b.owner_email}</div>
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>{b.court_count}</td>
                  <td style={{ fontSize: '0.875rem' }}>{b.booking_count}</td>
                  <td>
                    {b.is_verified ? (
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(34,197,94,0.15)', color: 'var(--success)' }}>✓ Verified</span>
                    ) : (
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(245,158,11,0.15)', color: 'var(--warning)' }}>Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {businesses.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>No businesses registered yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
