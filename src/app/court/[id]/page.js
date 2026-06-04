'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import StatusPill from '@/components/StatusPill';

const SPORT_EMOJIS = { tennis: '🎾', padel: '🏓', badminton: '🏸', soccer: '⚽', basketball: '🏀' };

function timeOptions() {
  const opts = [];
  for (let h = 6; h <= 22; h++) {
    const label = `${String(h).padStart(2, '0')}:00`;
    opts.push(label);
  }
  return opts;
}

function calcEndTime(start, durationH) {
  if (!start) return '';
  const [h, m] = start.split(':').map(Number);
  const totalMins = h * 60 + m + durationH * 60;
  const eh = Math.floor(totalMins / 60);
  const em = totalMins % 60;
  if (eh > 22) return '';
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}

export default function CourtDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courtId = params.id;

  const [court, setCourt] = useState(null);
  const [amenities, setAmenities] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [user, setUser] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking form
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [duration, setDuration] = useState(1);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [gopayPhone, setGopayPhone] = useState('');
  const [transferRef, setTransferRef] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Review form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, [courtId]);

  async function fetchData() {
    setLoading(true);
    try {
      const [courtRes, userRes, pmRes] = await Promise.all([
        fetch(`/api/courts/${courtId}`),
        fetch('/api/auth/me'),
        fetch('/api/payments/methods'),
      ]);
      const courtData = await courtRes.json();
      const userData = await userRes.json();
      const pmData = await pmRes.json();

      setCourt(courtData.court);
      setAmenities(courtData.amenities || []);
      setReviews(courtData.reviews || []);
      setUser(userData.user);
      setPaymentMethods(pmData.methods || []);
      if (pmData.methods?.length > 0) setPaymentMethod(pmData.methods[0].code);
    } catch (_e) {
      setCourt(null);
    } finally {
      setLoading(false);
    }
  }

  const endTime = calcEndTime(startTime, duration);
  const totalPrice = court ? Number(court.price_per_hour) * duration : 0;

  async function handleBooking(e) {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess(null);
    setBookingLoading(true);

    try {
      if (!bookingDate) {
        setBookingError('Please select a booking date.');
        setBookingLoading(false);
        return;
      }
      if (!endTime) {
        setBookingError('Invalid time selection. End time exceeds 22:00.');
        setBookingLoading(false);
        return;
      }

      const bookRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          court_id: courtId,
          user_id: user.id,
          booking_date: bookingDate,
          start_time: startTime,
          end_time: endTime,
          total_price: totalPrice,
          notes,
        }),
      });
      const bookData = await bookRes.json();
      if (!bookRes.ok) {
        setBookingError(bookData.error || 'Booking failed.');
        setBookingLoading(false);
        return;
      }

      const bookingId = bookData.booking_id;
      let paymentResult = null;

      // Process payment
      if (paymentMethod === 'GOPAY') {
        const pRes = await fetch('/api/payments/gopay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_id: bookingId, user_id: user.id, phone_number: gopayPhone, amount: totalPrice }),
        });
        const pData = await pRes.json();
        paymentResult = pData.transaction;
      } else if (paymentMethod === 'BCA_VA') {
        const pRes = await fetch('/api/payments/bca-va', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_id: bookingId, user_id: user.id, customer_name: user.full_name, amount: totalPrice }),
        });
        const pData = await pRes.json();
        paymentResult = pData.transaction;
      } else if (paymentMethod === 'BCA_TF') {
        const pRes = await fetch('/api/payments/bca-transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_id: bookingId, user_id: user.id, amount: totalPrice, transfer_ref: transferRef }),
        });
        const pData = await pRes.json();
        paymentResult = pData.transaction;
      } else {
        // Direct payment (CASH, QRIS, CARD)
        const pRes = await fetch('/api/payments/direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_id: bookingId, user_id: user.id, method_code: paymentMethod, amount: totalPrice }),
        });
        const pData = await pRes.json();
        paymentResult = pData.payment;
      }

      setBookingSuccess({ bookingId, paymentResult, totalPrice, startTime, endTime: endTime, bookingDate, paymentMethod });
    } catch (err) {
      setBookingError('An error occurred. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  }

  async function handleReview(e) {
    e.preventDefault();
    setReviewMsg('');
    setReviewLoading(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ court_id: courtId, user_id: user.id, rating: reviewRating, comment: reviewComment }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviewMsg('Review submitted!');
        setReviewComment('');
        fetchData();
      } else {
        setReviewMsg(data.error || 'Failed to submit review.');
      }
    } catch (_e) {
      setReviewMsg('Error submitting review.');
    } finally {
      setReviewLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--muted)' }}>
        Loading court details...
      </div>
    );
  }

  if (!court) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem' }}>
        <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Court not found.</p>
        <button className="btn-outline" onClick={() => router.push('/browse')}>Back to Browse</button>
      </div>
    );
  }

  const sport = court.sport?.toLowerCase() || '';
  const emoji = SPORT_EMOJIS[sport] || '🏟';
  const avgRating = parseFloat(court.avg_rating) || 0;

  return (
    <div className="container-main" style={{ padding: '2rem 1.5rem' }}>
      {/* Back button */}
      <button
        className="btn-outline"
        style={{ marginBottom: '1.5rem', padding: '6px 14px', fontSize: '0.85rem' }}
        onClick={() => router.push('/browse')}
      >
        ← Back to Browse
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
        {/* Left: Court Info */}
        <div>
          {/* Header */}
          <div style={{
            background: 'var(--navy-card)',
            border: '1px solid var(--navy-border)',
            borderRadius: '12px',
            padding: '1.75rem',
            marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '3rem' }}>{emoji}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span className={`sport-badge badge-${sport}`}>{sport}</span>
                  <span style={{
                    padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600,
                    background: court.is_indoor ? 'rgba(59,130,246,0.15)' : 'rgba(34,197,94,0.1)',
                    color: court.is_indoor ? 'var(--blue-light)' : 'var(--success)',
                  }}>
                    {court.is_indoor ? '🏛 Indoor' : '🌿 Outdoor'}
                  </span>
                </div>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.6rem', fontWeight: 700, color: 'var(--white)', marginBottom: '6px' }}>
                  {court.name}
                </h1>
                <p className="location-text">📍 {court.location}{court.city ? `, ${court.city}` : ''}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {avgRating > 0 && (
                <span className="rating-text">★ {avgRating.toFixed(1)} ({court.review_count} reviews)</span>
              )}
              {court.business_name && (
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>🏢 {court.business_name}</span>
              )}
            </div>
          </div>

          {/* Description */}
          {court.description && (
            <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--white)' }}>About this Court</h2>
              <p style={{ color: 'var(--text)', lineHeight: 1.6, fontSize: '0.9rem' }}>{court.description}</p>
            </div>
          )}

          {/* Amenities */}
          {amenities.length > 0 && (
            <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--white)' }}>Amenities</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {amenities.map((a, i) => (
                  <span key={i} style={{
                    padding: '4px 12px', borderRadius: '6px', fontSize: '0.82rem',
                    background: 'var(--navy-mid)', border: '1px solid var(--navy-border)', color: 'var(--text)',
                  }}>
                    ✓ {a.amenity_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* External URL */}
          {court.external_url && (
            <div style={{ marginBottom: '1.5rem' }}>
              <a href={court.external_url} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                🔗 Visit Website
              </a>
            </div>
          )}

          {/* Reviews */}
          <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--white)' }}>
              Reviews {reviews.length > 0 && <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '0.875rem' }}>({reviews.length})</span>}
            </h2>

            {reviews.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>No reviews yet. Be the first to review!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reviews.map(r => (
                  <div key={r.id} style={{ borderBottom: '1px solid var(--navy-border)', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div className="user-badge" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                        {r.user_name?.charAt(0) || 'U'}
                      </div>
                      <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.875rem' }}>{r.user_name || 'Anonymous'}</span>
                      <span style={{ color: 'var(--warning)', fontSize: '0.85rem' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    </div>
                    {r.comment && <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.5, marginLeft: '36px' }}>{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Leave review form */}
            {user && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--navy-border)' }}>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--white)' }}>Leave a Review</h3>
                <form onSubmit={handleReview}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label>Rating: {reviewRating}/5</label>
                    <input type="range" min={1} max={5} value={reviewRating} onChange={e => setReviewRating(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--warning)', cursor: 'pointer' }} />
                    <div style={{ color: 'var(--warning)', fontSize: '1.1rem' }}>{'★'.repeat(reviewRating)}{'☆'.repeat(5 - reviewRating)}</div>
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label>Comment (optional)</label>
                    <textarea rows={3} value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Share your experience..." />
                  </div>
                  {reviewMsg && <p style={{ color: reviewMsg.includes('!') ? 'var(--success)' : 'var(--danger)', fontSize: '0.85rem', marginBottom: '8px' }}>{reviewMsg}</p>}
                  <button type="submit" className="btn-primary" disabled={reviewLoading}>
                    {reviewLoading ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Right: Booking Panel */}
        <div style={{ position: 'sticky', top: '80px' }}>
          <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <span className="price-text" style={{ fontSize: '1.5rem' }}>
                Rp {Number(court.price_per_hour).toLocaleString('id-ID')}
              </span>
              <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>/hr</span>
            </div>

            {!user ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <p style={{ color: 'var(--muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Please login to book this court.
                </p>
                <button className="btn-lime" style={{ width: '100%' }} onClick={() => router.push(`/login?redirect=/court/${courtId}`)}>
                  Login to Book
                </button>
              </div>
            ) : bookingSuccess ? (
              <div className="alert-success" style={{ padding: '1rem' }}>
                <p style={{ fontWeight: 700, marginBottom: '8px' }}>Booking Confirmed! ✓</p>
                <p style={{ fontSize: '0.85rem' }}>Booking ID: #{bookingSuccess.bookingId}</p>
                <p style={{ fontSize: '0.85rem' }}>Date: {bookingSuccess.bookingDate}</p>
                <p style={{ fontSize: '0.85rem' }}>Time: {bookingSuccess.startTime} – {bookingSuccess.endTime}</p>
                <p style={{ fontSize: '0.85rem' }}>Total: Rp {Number(bookingSuccess.totalPrice).toLocaleString('id-ID')}</p>
                {bookingSuccess.paymentMethod === 'BCA_VA' && bookingSuccess.paymentResult?.va_number && (
                  <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>VA Number: <strong>{bookingSuccess.paymentResult.va_number}</strong></p>
                )}
                {bookingSuccess.paymentMethod === 'GOPAY' && bookingSuccess.paymentResult?.gopay_order_id && (
                  <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>GoPay Order: <strong>{bookingSuccess.paymentResult.gopay_order_id}</strong></p>
                )}
                <button className="btn-outline" style={{ width: '100%', marginTop: '12px' }} onClick={() => router.push('/dashboard/customer')}>
                  View My Bookings
                </button>
              </div>
            ) : (
              <form onSubmit={handleBooking}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label>Booking Date</label>
                  <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]} required />
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label>Start Time</label>
                  <select value={startTime} onChange={e => setStartTime(e.target.value)}>
                    {timeOptions().map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label>Duration</label>
                  <select value={duration} onChange={e => setDuration(Number(e.target.value))}>
                    {[1, 1.5, 2, 2.5, 3, 3.5, 4].map(d => (
                      <option key={d} value={d}>{d} hour{d !== 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                {endTime && (
                  <div style={{ marginBottom: '0.75rem', padding: '8px', background: 'var(--navy-mid)', borderRadius: '6px', fontSize: '0.82rem', color: 'var(--muted)' }}>
                    End time: <strong style={{ color: 'var(--text)' }}>{endTime}</strong>
                  </div>
                )}

                <div style={{ marginBottom: '0.75rem' }}>
                  <label>Notes (optional)</label>
                  <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special requests?" />
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label>Payment Method</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                    {paymentMethods.map(pm => (
                      <option key={pm.code} value={pm.code}>{pm.name}</option>
                    ))}
                  </select>
                </div>

                {paymentMethod === 'GOPAY' && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label>GoPay Phone Number</label>
                    <input type="tel" value={gopayPhone} onChange={e => setGopayPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
                  </div>
                )}

                {paymentMethod === 'BCA_TF' && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label>Transfer Reference (optional)</label>
                    <input type="text" value={transferRef} onChange={e => setTransferRef(e.target.value)} placeholder="e.g. TF-12345" />
                  </div>
                )}

                {/* Total */}
                <div style={{
                  background: 'var(--navy-mid)', borderRadius: '8px', padding: '12px',
                  marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Total Price</span>
                  <span className="price-text">Rp {Number(totalPrice).toLocaleString('id-ID')}</span>
                </div>

                {bookingError && (
                  <div className="alert-error" style={{ marginBottom: '0.75rem' }}>{bookingError}</div>
                )}

                <button type="submit" className="btn-lime" style={{ width: '100%' }} disabled={bookingLoading}>
                  {bookingLoading ? 'Processing...' : 'Confirm Booking & Pay'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
