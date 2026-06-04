'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StatusPill from '@/components/StatusPill';

export default function CustomerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  const [profileSubTab, setProfileSubTab] = useState('edit');

  // Profile edit
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password change
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (!data.user) {
      router.push('/login');
      return;
    }
    setUser(data.user);
    setFullName(data.user.full_name || '');
    setEmail(data.user.email || '');
    setPhone(data.user.phone || '');
    fetchBookings(data.user.id);
  }

  async function fetchBookings(userId) {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?user_id=${userId}`);
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (_e) {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(bookingId) {
    if (!confirm('Cancel this booking?')) return;
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    if (res.ok) fetchBookings(user.id);
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    setProfileMsg('');
    setProfileLoading(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(prev => ({ ...prev, ...data.user }));
        setProfileMsg('Profile updated successfully!');
      } else {
        setProfileMsg(data.error || 'Update failed.');
      }
    } catch (_e) {
      setProfileMsg('Error updating profile.');
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwdMsg('');
    if (newPwd !== confirmPwd) { setPwdMsg('Passwords do not match.'); return; }
    if (newPwd.length < 6) { setPwdMsg('Password must be at least 6 characters.'); return; }
    setPwdLoading(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPwd, new_password: newPwd }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwdMsg('Password changed successfully!');
        setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      } else {
        setPwdMsg(data.error || 'Password change failed.');
      }
    } catch (_e) {
      setPwdMsg('Error changing password.');
    } finally {
      setPwdLoading(false);
    }
  }

  if (!user) return null;

  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;

  return (
    <div className="container-main" style={{ padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{
        background: 'var(--navy-card)',
        border: '1px solid var(--navy-border)',
        borderRadius: '12px',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div className="user-badge" style={{ width: '52px', height: '52px', fontSize: '1.2rem', flexShrink: 0 }}>
          {user.full_name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--white)' }}>
            {user.full_name}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{user.email}</p>
          {user.phone && <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>📞 {user.phone}</p>}
        </div>
        <span style={{
          marginLeft: 'auto', padding: '3px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
          background: 'rgba(34,197,94,0.1)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.2)',
        }}>
          Customer
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
        {['bookings', 'account'].map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'bookings' ? '📋 My Bookings' : '⚙️ Account'}
          </button>
        ))}
      </div>

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div>
          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Bookings', val: totalBookings, color: 'var(--blue-light)' },
              { label: 'Confirmed', val: confirmedBookings, color: 'var(--success)' },
              { label: 'Pending', val: pendingBookings, color: 'var(--warning)' },
            ].map(k => (
              <div key={k.label} className="kpi-card">
                <div className="kpi-val" style={{ color: k.color }}>{k.val}</div>
                <div className="kpi-label">{k.label}</div>
              </div>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '3rem',
              background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
              <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>You have no bookings yet.</p>
              <button className="btn-lime" onClick={() => router.push('/browse')}>Browse Courts</button>
            </div>
          ) : (
            <div style={{
              background: 'var(--navy-card)',
              border: '1px solid var(--navy-border)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}>
              <table>
                <thead>
                  <tr>
                    <th>Court</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Price</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.875rem' }}>{b.court_name}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>📍 {b.city}</div>
                      </td>
                      <td style={{ fontSize: '0.875rem' }}>{b.booking_date}</td>
                      <td style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{b.start_time} – {b.end_time}</td>
                      <td><StatusPill status={b.status} /></td>
                      <td style={{ fontSize: '0.875rem', color: 'var(--lime)', fontWeight: 600 }}>
                        Rp {Number(b.total_price).toLocaleString('id-ID')}
                      </td>
                      <td>
                        {b.status === 'pending' && (
                          <button className="btn-danger" onClick={() => handleCancel(b.id)}>Cancel</button>
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

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Profile sub-tabs */}
          <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
              {['edit', 'password'].map(st => (
                <button
                  key={st}
                  className={`tab-btn ${profileSubTab === st ? 'active' : ''}`}
                  style={{ fontSize: '0.82rem', padding: '5px 12px' }}
                  onClick={() => setProfileSubTab(st)}
                >
                  {st === 'edit' ? '✏️ Edit Profile' : '🔐 Change Password'}
                </button>
              ))}
            </div>

            {profileSubTab === 'edit' && (
              <form onSubmit={handleProfileSave}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label>Full Name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label>Phone</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                {profileMsg && (
                  <div className={profileMsg.includes('!') ? 'alert-success' : 'alert-error'} style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                    {profileMsg}
                  </div>
                )}
                <button type="submit" className="btn-primary" disabled={profileLoading}>
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}

            {profileSubTab === 'password' && (
              <form onSubmit={handlePasswordChange}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label>Current Password</label>
                  <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} required />
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label>New Password</label>
                  <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label>Confirm New Password</label>
                  <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required />
                </div>
                {pwdMsg && (
                  <div className={pwdMsg.includes('!') ? 'alert-success' : 'alert-error'} style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                    {pwdMsg}
                  </div>
                )}
                <button type="submit" className="btn-primary" disabled={pwdLoading}>
                  {pwdLoading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            )}
          </div>

          {/* Quick stats */}
          <div>
            <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', padding: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--white)', marginBottom: '1rem' }}>
                Account Summary
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Member Since', val: user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '-' },
                  { label: 'Total Bookings', val: totalBookings },
                  { label: 'Confirmed Bookings', val: confirmedBookings },
                  { label: 'Total Spent', val: `Rp ${bookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + Number(b.total_price), 0).toLocaleString('id-ID')}` },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--navy-border)' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{item.label}</span>
                    <span style={{ color: 'var(--text)', fontSize: '0.85rem', fontWeight: 600 }}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
