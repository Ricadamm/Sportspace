'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState('customer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const body = {
        full_name: fullName,
        email,
        password,
        role,
        phone,
      };

      if (role === 'owner') {
        if (!businessName.trim()) {
          setError('Business name is required for court owners.');
          setLoading(false);
          return;
        }
        body.business_name = businessName;
        body.business_address = businessAddress;
        body.business_phone = businessPhone;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed.');
        return;
      }

      const user = data.user;
      if (user.role === 'owner') {
        router.push('/dashboard/owner');
      } else {
        router.push('/');
      }
    } catch (_e) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: 'var(--navy-card)',
        border: '1px solid var(--navy-border)',
        borderRadius: '16px',
        padding: '2.5rem',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '48px', height: '48px',
            background: 'linear-gradient(135deg, var(--blue), var(--lime-dark))',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem',
            color: 'white', margin: '0 auto 1rem',
          }}>SS</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--white)' }}>
            Create Account
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            Join SportSpace today
          </p>
        </div>

        {/* Role toggle */}
        <div style={{ display: 'flex', background: 'var(--navy-mid)', borderRadius: '10px', padding: '4px', marginBottom: '1.5rem' }}>
          {[
            { value: 'customer', label: '👤 Customer' },
            { value: 'owner', label: '🏢 Court Owner' },
          ].map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                transition: 'all 0.2s',
                background: role === r.value ? 'var(--blue)' : 'transparent',
                color: role === r.value ? 'white' : 'var(--muted)',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+62 xxx xxxx xxxx"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              required
            />
          </div>

          <div style={{ marginBottom: role === 'owner' ? '1rem' : '1.5rem' }}>
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              required
            />
          </div>

          {/* Owner-specific fields */}
          {role === 'owner' && (
            <div style={{
              background: 'var(--navy-mid)',
              border: '1px solid var(--navy-border)',
              borderRadius: '10px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.9rem', fontWeight: 700, color: 'var(--white)', marginBottom: '1rem' }}>
                Business Information
              </h3>
              <div style={{ marginBottom: '0.75rem' }}>
                <label>Business Name *</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="e.g. Sentul Sport Center"
                />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label>Business Address</label>
                <input
                  type="text"
                  value={businessAddress}
                  onChange={e => setBusinessAddress(e.target.value)}
                  placeholder="Full business address"
                />
              </div>
              <div>
                <label>Business Phone</label>
                <input
                  type="tel"
                  value={businessPhone}
                  onChange={e => setBusinessPhone(e.target.value)}
                  placeholder="Business contact number"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>
          )}

          <button
            type="submit"
            className="btn-lime"
            style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--blue-light)', textDecoration: 'none', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
