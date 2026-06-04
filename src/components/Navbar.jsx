'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
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
    } catch (_e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
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
