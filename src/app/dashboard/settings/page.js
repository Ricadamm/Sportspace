'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [courts, setCourts] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [usersLoading, setUsersLoading] = useState(false);
  const [courtsLoading, setCourtsLoading] = useState(false);
  const [roleMsg, setRoleMsg] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      if (activeTab === 'users') loadUsers();
      else if (activeTab === 'courts') loadCourts();
    }
  }, [activeTab, user]);

  async function checkAuth() {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (!data.user || data.user.role !== 'admin') {
      router.push('/login');
      return;
    }
    setUser(data.user);
    loadUsers();
  }

  async function loadUsers() {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/admin/users?limit=100');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (_e) {
    } finally {
      setUsersLoading(false);
    }
  }

  async function loadCourts() {
    setCourtsLoading(true);
    try {
      const res = await fetch('/api/courts');
      const data = await res.json();
      setCourts(data.courts || []);
    } catch (_e) {
    } finally {
      setCourtsLoading(false);
    }
  }

  async function handleRoleChange(userId, role) {
    setRoleMsg('');
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, role }),
    });
    if (res.ok) {
      setRoleMsg('Role updated!');
      loadUsers();
    } else {
      const data = await res.json();
      setRoleMsg(data.error || 'Failed.');
    }
  }

  async function handleCourtToggle(courtId, isActive) {
    // Direct API call to toggle
    const res = await fetch(`/api/owner/courts/${courtId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: isActive ? 0 : 1 }),
    });
    if (res.ok) loadCourts();
    else {
      // Fallback: just reload
      loadCourts();
    }
  }

  if (!user) return null;

  return (
    <div className="container-main" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
        <span style={{ fontSize: '2rem' }}>⚙️</span>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--white)' }}>
            Platform Settings
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>User management & court control</p>
        </div>
      </div>

      {/* Platform Info */}
      <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Platform', val: 'SportSpace v1.0' },
            { label: 'Admin', val: user.full_name },
            { label: 'Email', val: user.email },
            { label: 'Environment', val: 'Production' },
          ].map(item => (
            <div key={item.label}>
              <div style={{ color: 'var(--muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{item.label}</div>
              <div style={{ color: 'var(--text)', fontSize: '0.875rem', fontWeight: 500 }}>{item.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
        {[
          { key: 'users', label: '👥 User Management' },
          { key: 'courts', label: '🏟 Court Management' },
        ].map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          {roleMsg && (
            <div className={roleMsg.includes('!') ? 'alert-success' : 'alert-error'} style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
              {roleMsg}
            </div>
          )}
          {usersLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>Loading users...</div>
          ) : (
            <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr>
                    <th>#ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Change Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>#{u.id}</td>
                      <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.full_name}</td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{u.email}</td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{u.phone || '—'}</td>
                      <td>
                        <span style={{
                          padding: '2px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
                          background: u.role === 'admin' ? 'rgba(239,68,68,0.15)' : u.role === 'owner' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.1)',
                          color: u.role === 'admin' ? 'var(--danger)' : u.role === 'owner' ? 'var(--warning)' : 'var(--success)',
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '—'}
                      </td>
                      <td>
                        {u.id !== user.id && (
                          <select
                            value={u.role}
                            onChange={e => handleRoleChange(u.id, e.target.value)}
                            style={{ padding: '4px 8px', fontSize: '0.78rem', width: 'auto' }}
                          >
                            <option value="customer">Customer</option>
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                        {u.id === user.id && <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>You</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>No users found.</div>}
            </div>
          )}
        </div>
      )}

      {/* Courts Tab */}
      {activeTab === 'courts' && (
        <div>
          {courtsLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>Loading courts...</div>
          ) : (
            <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr>
                    <th>#ID</th>
                    <th>Name</th>
                    <th>Sport</th>
                    <th>Location</th>
                    <th>Price/hr</th>
                    <th>Status</th>
                    <th>Rating</th>
                    <th>Toggle</th>
                  </tr>
                </thead>
                <tbody>
                  {courts.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>#{c.id}</td>
                      <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.name}</td>
                      <td>
                        <span className={`sport-badge badge-${c.sport}`} style={{ fontSize: '0.7rem' }}>
                          {{ tennis: '🎾', padel: '🏓', badminton: '🏸', soccer: '⚽', basketball: '🏀' }[c.sport]} {c.sport}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{c.city}</td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--lime)', fontWeight: 600 }}>
                        Rp {Number(c.price_per_hour).toLocaleString('id-ID')}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: c.is_active ? 'var(--success)' : 'var(--danger)' }}>
                          {c.is_active ? '● Active' : '● Inactive'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--warning)' }}>
                        {parseFloat(c.avg_rating) > 0 ? `★ ${parseFloat(c.avg_rating).toFixed(1)}` : '—'}
                      </td>
                      <td>
                        <button
                          className={c.is_active ? 'btn-danger' : 'btn-success'}
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          onClick={() => handleCourtToggle(c.id, c.is_active)}
                        >
                          {c.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {courts.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>No courts found.</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
