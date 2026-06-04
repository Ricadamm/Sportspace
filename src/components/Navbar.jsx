'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  async function fetchUser() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user);
      if (data.user) {
        fetchNotifications();
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (_e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications?limit=8');
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(Number(data.unread_count || 0));
      }
    } catch (_e) {}
  }

  async function markAllNotificationsRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mark_all_read: true }),
    });
    fetchNotifications();
  }

  async function openNotification(notification) {
    await fetch(`/api/notifications/${notification.id}`, { method: 'PATCH' });
    setNotificationOpen(false);
    fetchNotifications();
    if (notification.link_url) router.push(notification.link_url);
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
    setNotificationOpen(false);
    router.push('/');
  }

  function getDashboardLink() {
    if (!user) return null;
    if (user.role === 'admin') return '/dashboard/admin';
    if (user.role === 'owner') return '/dashboard/owner';
    return '/dashboard/customer';
  }

  const dashboardLink = getDashboardLink();

  return (
    <nav style={{
      background: 'var(--navy-card)',
      borderBottom: '1px solid var(--navy-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div className="container-main">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, var(--blue), var(--lime-dark))',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '0.9rem',
              color: 'white',
            }}>
              SS
            </div>
            <span style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '1.2rem',
              color: 'var(--white)',
            }}>
              Sport<span style={{ color: 'var(--lime)' }}>Space</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="hidden md:flex">
            <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--text)'}
              onMouseLeave={e => e.target.style.color = 'var(--muted)'}
            >
              Home
            </Link>
            <Link href="/browse" style={{ color: 'var(--muted)', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 500 }}
              onMouseEnter={e => e.target.style.color = 'var(--text)'}
              onMouseLeave={e => e.target.style.color = 'var(--muted)'}
            >
              Browse Courts
            </Link>

            {!loading && user && (
              <>
                {dashboardLink && (
                  <Link href={dashboardLink} style={{ color: 'var(--muted)', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 500 }}
                    onMouseEnter={e => e.target.style.color = 'var(--text)'}
                    onMouseLeave={e => e.target.style.color = 'var(--muted)'}
                  >
                    {user.role === 'admin' ? 'Admin' : user.role === 'owner' ? 'Dashboard' : 'My Bookings'}
                  </Link>
                )}
                {user.role === 'admin' && (
                  <>
                    <Link href="/dashboard/financials" style={{ color: 'var(--muted)', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 500 }}
                      onMouseEnter={e => e.target.style.color = 'var(--text)'}
                      onMouseLeave={e => e.target.style.color = 'var(--muted)'}
                    >
                      Financials
                    </Link>
                    <Link href="/dashboard/settings" style={{ color: 'var(--muted)', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 500 }}
                      onMouseEnter={e => e.target.style.color = 'var(--text)'}
                      onMouseLeave={e => e.target.style.color = 'var(--muted)'}
                    >
                      Settings
                    </Link>
                  </>
                )}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setNotificationOpen((open) => !open)}
                    title="Notifications"
                    aria-label="Notifications"
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      border: '1px solid var(--navy-border)',
                      background: notificationOpen ? 'var(--navy-mid)' : 'transparent',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      fontWeight: 800,
                      position: 'relative',
                    }}
                  >
                    !
                    {unreadCount > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        minWidth: '18px',
                        height: '18px',
                        padding: '0 5px',
                        borderRadius: '999px',
                        background: 'var(--lime)',
                        color: 'var(--navy)',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        lineHeight: '18px',
                        border: '1px solid var(--navy-card)',
                      }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationOpen && (
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      top: '42px',
                      width: '340px',
                      maxWidth: 'calc(100vw - 32px)',
                      background: 'var(--navy-card)',
                      border: '1px solid var(--navy-border)',
                      borderRadius: '8px',
                      boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
                      overflow: 'hidden',
                      zIndex: 200,
                    }}>
                      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--navy-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <div>
                          <div style={{ color: 'var(--white)', fontWeight: 700, fontSize: '0.9rem' }}>Notifications</div>
                          <div style={{ color: 'var(--muted)', fontSize: '0.74rem' }}>{unreadCount} unread</div>
                        </div>
                        {notifications.length > 0 && (
                          <button
                            onClick={markAllNotificationsRead}
                            style={{ background: 'transparent', border: 'none', color: 'var(--blue-light)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                          <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <button
                              key={notification.id}
                              onClick={() => openNotification(notification)}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '12px 14px',
                                border: 'none',
                                borderBottom: '1px solid rgba(30,45,69,0.55)',
                                background: notification.is_read ? 'transparent' : 'rgba(37,99,235,0.1)',
                                cursor: 'pointer',
                              }}
                            >
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <span style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: notification.is_read ? 'var(--navy-border)' : 'var(--lime)',
                                  marginTop: '6px',
                                  flexShrink: 0,
                                }} />
                                <span>
                                  <span style={{ display: 'block', color: 'var(--white)', fontWeight: 700, fontSize: '0.84rem', marginBottom: '3px' }}>
                                    {notification.title}
                                  </span>
                                  <span style={{ display: 'block', color: 'var(--muted)', fontSize: '0.78rem', lineHeight: 1.35 }}>
                                    {notification.message}
                                  </span>
                                  <span style={{ display: 'block', color: 'var(--blue-light)', fontSize: '0.7rem', marginTop: '6px' }}>
                                    {new Date(notification.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                  </span>
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
                  <div className="user-badge" title={user.full_name}>
                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span style={{ color: 'var(--text)', fontSize: '0.875rem', fontWeight: 500 }}>
                    {user.full_name?.split(' ')[0]}
                  </span>
                  <button
                    onClick={handleLogout}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: 'var(--danger)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px',
                      padding: '5px 12px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Logout
                  </button>
                </div>
              </>
            )}

            {!loading && !user && (
              <>
                <Link href="/login">
                  <button className="btn-outline" style={{ padding: '6px 16px', fontSize: '0.875rem' }}>
                    Login
                  </button>
                </Link>
                <Link href="/register">
                  <button className="btn-lime" style={{ padding: '6px 16px', fontSize: '0.875rem' }}>
                    Sign Up
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '1.5rem', display: 'none' }}
            className="md:hidden"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div style={{
            borderTop: '1px solid var(--navy-border)',
            padding: '1rem 0',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            <Link href="/" onClick={() => setMenuOpen(false)} style={{ color: 'var(--text)', textDecoration: 'none', padding: '8px 4px', fontSize: '0.9rem' }}>Home</Link>
            <Link href="/browse" onClick={() => setMenuOpen(false)} style={{ color: 'var(--text)', textDecoration: 'none', padding: '8px 4px', fontSize: '0.9rem' }}>Browse Courts</Link>
            {user && dashboardLink && (
              <Link href={dashboardLink} onClick={() => setMenuOpen(false)} style={{ color: 'var(--text)', textDecoration: 'none', padding: '8px 4px', fontSize: '0.9rem' }}>Dashboard</Link>
            )}
            {user && (
              <button
                onClick={() => setNotificationOpen((open) => !open)}
                style={{ color: 'var(--text)', background: 'none', border: 'none', textAlign: 'left', padding: '8px 4px', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
              </button>
            )}
            {user && notificationOpen && (
              <div style={{ background: 'var(--navy-mid)', border: '1px solid var(--navy-border)', borderRadius: '8px', overflow: 'hidden', margin: '4px 0 8px' }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--navy-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--white)', fontWeight: 700, fontSize: '0.86rem' }}>{unreadCount} unread</span>
                  {notifications.length > 0 && (
                    <button onClick={markAllNotificationsRead} style={{ background: 'transparent', border: 'none', color: 'var(--blue-light)', fontSize: '0.78rem', fontWeight: 700 }}>
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '18px 12px', color: 'var(--muted)', fontSize: '0.84rem' }}>No notifications yet.</div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => {
                        setMenuOpen(false);
                        openNotification(notification);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        border: 'none',
                        borderBottom: '1px solid rgba(30,45,69,0.55)',
                        background: notification.is_read ? 'transparent' : 'rgba(37,99,235,0.12)',
                      }}
                    >
                      <span style={{ display: 'block', color: 'var(--white)', fontWeight: 700, fontSize: '0.82rem' }}>{notification.title}</span>
                      <span style={{ display: 'block', color: 'var(--muted)', fontSize: '0.76rem', lineHeight: 1.35 }}>{notification.message}</span>
                    </button>
                  ))
                )}
              </div>
            )}
            {user?.role === 'admin' && (
              <>
                <Link href="/dashboard/financials" onClick={() => setMenuOpen(false)} style={{ color: 'var(--text)', textDecoration: 'none', padding: '8px 4px', fontSize: '0.9rem' }}>Financials</Link>
                <Link href="/dashboard/settings" onClick={() => setMenuOpen(false)} style={{ color: 'var(--text)', textDecoration: 'none', padding: '8px 4px', fontSize: '0.9rem' }}>Settings</Link>
              </>
            )}
            {user ? (
              <button onClick={handleLogout} style={{ color: 'var(--danger)', background: 'none', border: 'none', textAlign: 'left', padding: '8px 4px', fontSize: '0.9rem', cursor: 'pointer' }}>
                Logout
              </button>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} style={{ color: 'var(--text)', textDecoration: 'none', padding: '8px 4px', fontSize: '0.9rem' }}>Login</Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} style={{ color: 'var(--lime)', textDecoration: 'none', padding: '8px 4px', fontSize: '0.9rem' }}>Sign Up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
