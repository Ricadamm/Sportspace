'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StatusPill from '@/components/StatusPill';

const METHOD_COLORS = {
  GOPAY: '#00AAD4',
  BCA_VA: '#0066AE',
  BCA_TF: '#1B4FAB',
  CASH: '#22C55E',
  QRIS: '#8B5CF6',
  CARD: '#F59E0B',
};

function fmt(n) { return `Rp ${Number(n || 0).toLocaleString('id-ID')}`; }

export default function FinancialsDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('ledger');

  const [ledger, setLedger] = useState([]);
  const [revenueByMethod, setRevenueByMethod] = useState([]);
  const [gopayTxns, setGopayTxns] = useState([]);
  const [bcaVaTxns, setBcaVaTxns] = useState([]);
  const [bcaTfTxns, setBcaTfTxns] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [bankConfig, setBankConfig] = useState(null);
  const [gopayConfig, setGopayConfig] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);

  // Settle GoPay form
  const [settleOrderId, setSettleOrderId] = useState('');
  const [settleTxnId, setSettleTxnId] = useState('');
  const [settleMsg, setSettleMsg] = useState('');

  // Confirm BCA VA form
  const [confirmVa, setConfirmVa] = useState('');
  const [confirmNtb, setConfirmNtb] = useState('');
  const [confirmVaMsg, setConfirmVaMsg] = useState('');

  // Verify BCA Transfer form
  const [verifyTfId, setVerifyTfId] = useState('');
  const [verifyApproved, setVerifyApproved] = useState(true);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifyTfMsg, setVerifyTfMsg] = useState('');

  // Record direct payment form
  const [dpBookingId, setDpBookingId] = useState('');
  const [dpMethodCode, setDpMethodCode] = useState('CASH');
  const [dpAmount, setDpAmount] = useState('');
  const [dpNotes, setDpNotes] = useState('');
  const [dpMsg, setDpMsg] = useState('');

  // Refund form
  const [refundPaymentId, setRefundPaymentId] = useState('');
  const [refundBookingId, setRefundBookingId] = useState('');
  const [refundChannel, setRefundChannel] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundMsg, setRefundMsg] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) loadTabData();
  }, [activeTab, user]);

  async function checkAuth() {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (!data.user || data.user.role !== 'admin') {
      router.push('/login');
      return;
    }
    setUser(data.user);
    loadRevenueByMethod();
  }

  async function loadRevenueByMethod() {
    try {
      const res = await fetch('/api/payments/revenue-by-method');
      const data = await res.json();
      setRevenueByMethod(data.revenue || []);
    } catch (_e) {}
  }

  async function loadTabData() {
    if (activeTab === 'ledger') {
      try {
        const res = await fetch('/api/payments/ledger');
        const data = await res.json();
        setLedger(data.ledger || []);
      } catch (_e) {}
    } else if (activeTab === 'gopay') {
      try {
        const res = await fetch('/api/payments/gopay');
        const data = await res.json();
        setGopayTxns(data.transactions || []);
      } catch (_e) {}
    } else if (activeTab === 'bca-va') {
      try {
        const res = await fetch('/api/payments/bca-va');
        const data = await res.json();
        setBcaVaTxns(data.transactions || []);
      } catch (_e) {}
    } else if (activeTab === 'bca-transfer') {
      try {
        const res = await fetch('/api/payments/bca-transfer');
        const data = await res.json();
        setBcaTfTxns(data.transactions || []);
      } catch (_e) {}
    } else if (activeTab === 'refunds') {
      try {
        const res = await fetch('/api/payments/refunds');
        const data = await res.json();
        setRefunds(data.refunds || []);
      } catch (_e) {}
    } else if (activeTab === 'config') {
      try {
        const [pmRes] = await Promise.all([
          fetch('/api/payments/methods'),
        ]);
        const pmData = await pmRes.json();
        setPaymentMethods(pmData.methods || []);
      } catch (_e) {}
    }
  }

  async function handleSettle(e) {
    e.preventDefault();
    setSettleMsg('');
    const res = await fetch('/api/payments/gopay', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gopay_order_id: settleOrderId, gopay_txn_id: settleTxnId }),
    });
    const data = await res.json();
    setSettleMsg(res.ok ? 'Transaction settled!' : (data.error || 'Failed.'));
    if (res.ok) { setSettleOrderId(''); setSettleTxnId(''); loadTabData(); }
  }

  async function handleConfirmVa(e) {
    e.preventDefault();
    setConfirmVaMsg('');
    const res = await fetch('/api/payments/bca-va', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ va_number: confirmVa, payment_ntb: confirmNtb }),
    });
    const data = await res.json();
    setConfirmVaMsg(res.ok ? 'VA payment confirmed!' : (data.error || 'Failed.'));
    if (res.ok) { setConfirmVa(''); setConfirmNtb(''); loadTabData(); }
  }

  async function handleVerifyTransfer(e) {
    e.preventDefault();
    setVerifyTfMsg('');
    const res = await fetch('/api/payments/bca-transfer', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transfer_id: Number(verifyTfId), approved: verifyApproved, notes: verifyNotes }),
    });
    const data = await res.json();
    setVerifyTfMsg(res.ok ? 'Transfer verified!' : (data.error || 'Failed.'));
    if (res.ok) { setVerifyTfId(''); setVerifyNotes(''); loadTabData(); }
  }

  async function handleDirectPayment(e) {
    e.preventDefault();
    setDpMsg('');
    const res = await fetch('/api/payments/direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: Number(dpBookingId), user_id: user.id, method_code: dpMethodCode, amount: Number(dpAmount), notes: dpNotes }),
    });
    const data = await res.json();
    setDpMsg(res.ok ? 'Payment recorded!' : (data.error || 'Failed.'));
    if (res.ok) { setDpBookingId(''); setDpAmount(''); setDpNotes(''); loadRevenueByMethod(); }
  }

  async function handleCreateRefund(e) {
    e.preventDefault();
    setRefundMsg('');
    const res = await fetch('/api/payments/refunds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_id: Number(refundPaymentId),
        booking_id: Number(refundBookingId),
        channel: refundChannel,
        amount: Number(refundAmount),
        reason: refundReason,
        admin_user_id: user.id,
      }),
    });
    const data = await res.json();
    setRefundMsg(res.ok ? 'Refund created!' : (data.error || 'Failed.'));
    if (res.ok) { setRefundPaymentId(''); setRefundBookingId(''); setRefundChannel(''); setRefundAmount(''); setRefundReason(''); loadTabData(); }
  }

  if (!user) return null;

  // Finance KPIs from revenue by method
  const totalGross = revenueByMethod.reduce((s, r) => s + Number(r.gross_amount || 0), 0);
  const totalFees = revenueByMethod.reduce((s, r) => s + Number(r.total_fees || 0), 0);
  const totalNet = revenueByMethod.reduce((s, r) => s + Number(r.net_amount || 0), 0);
  const totalTxns = revenueByMethod.reduce((s, r) => s + Number(r.txn_count || 0), 0);

  const TABS = ['ledger', 'gopay', 'bca-va', 'bca-transfer', 'direct', 'refunds', 'config'];
  const TAB_LABELS = {
    ledger: '📊 Ledger',
    gopay: '📱 GoPay',
    'bca-va': '🏦 BCA VA',
    'bca-transfer': '💸 BCA Transfer',
    direct: '🪙 Record Payment',
    refunds: '↩️ Refunds',
    config: '⚙️ Config',
  };

  return (
    <div className="container-main" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
        <span style={{ fontSize: '2rem' }}>💳</span>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--white)' }}>
            Financial Dashboard
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Payment management & revenue analytics</p>
        </div>
      </div>

      {/* Finance KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
        {[
          { label: 'Gross Revenue', val: fmt(totalGross), color: 'var(--blue-light)' },
          { label: 'Total Fees', val: fmt(totalFees), color: 'var(--warning)' },
          { label: 'Net Revenue', val: fmt(totalNet), color: 'var(--lime)' },
          { label: 'Transactions', val: totalTxns, color: 'var(--success)' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-val" style={{ color: k.color, fontSize: '1.1rem' }}>{k.val}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue by Method */}
      {revenueByMethod.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {revenueByMethod.map(r => (
            <div key={r.method_code} style={{
              background: 'var(--navy-card)',
              border: `1px solid ${METHOD_COLORS[r.method_code] || 'var(--navy-border)'}`,
              borderRadius: '10px',
              padding: '12px 16px',
              minWidth: '140px',
            }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: METHOD_COLORS[r.method_code] || 'var(--text)', marginBottom: '4px' }}>
                {r.method_code}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--white)' }}>{fmt(r.net_amount)}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.72rem', marginTop: '2px' }}>{r.txn_count} txns</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            onClick={() => setActiveTab(tab)}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* LEDGER */}
      {activeTab === 'ledger' && (
        <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>#ID</th>
                <th>Booking</th>
                <th>User</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Fee</th>
                <th>Net</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map(l => (
                <tr key={l.id}>
                  <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>#{l.id}</td>
                  <td style={{ fontSize: '0.82rem' }}>#{l.platform_booking_id}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{l.user_name || l.user_id}</td>
                  <td>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, color: METHOD_COLORS[l.method_code] || 'var(--text)', background: 'var(--navy-mid)' }}>
                      {l.method_code}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text)' }}>{fmt(l.amount)}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--warning)' }}>{fmt(l.fee)}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--lime)', fontWeight: 600 }}>{fmt(l.net_amount)}</td>
                  <td><StatusPill status={l.status} /></td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{l.created_at ? new Date(l.created_at).toLocaleDateString('id-ID') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {ledger.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>No ledger entries.</div>}
        </div>
      )}

      {/* GOPAY */}
      {activeTab === 'gopay' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
          <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', overflow: 'hidden' }}>
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Booking</th>
                  <th>Phone</th>
                  <th>Amount</th>
                  <th>Fee</th>
                  <th>Net</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {gopayTxns.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontSize: '0.75rem', color: 'var(--muted)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.gopay_order_id}</td>
                    <td style={{ fontSize: '0.82rem' }}>#{t.platform_booking_id}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{t.phone_number}</td>
                    <td style={{ fontSize: '0.82rem' }}>{fmt(t.amount)}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--warning)' }}>{fmt(t.fee)}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--lime)', fontWeight: 600 }}>{fmt(t.net_amount)}</td>
                    <td><StatusPill status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {gopayTxns.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>No GoPay transactions.</div>}
          </div>

          <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', padding: '1.25rem' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.9rem', fontWeight: 700, color: 'var(--white)', marginBottom: '1rem' }}>Settle Transaction</h3>
            <form onSubmit={handleSettle}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label>GoPay Order ID</label>
                <input type="text" value={settleOrderId} onChange={e => setSettleOrderId(e.target.value)} required placeholder="GOPAY-..." />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label>GoPay Txn ID</label>
                <input type="text" value={settleTxnId} onChange={e => setSettleTxnId(e.target.value)} placeholder="Optional" />
              </div>
              {settleMsg && <div className={settleMsg.includes('!') ? 'alert-success' : 'alert-error'} style={{ marginBottom: '0.75rem', fontSize: '0.82rem' }}>{settleMsg}</div>}
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>Settle</button>
            </form>
          </div>
        </div>
      )}

      {/* BCA VA */}
      {activeTab === 'bca-va' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
          <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', overflow: 'hidden' }}>
            <table>
              <thead>
                <tr>
                  <th>VA Number</th>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Expires</th>
                </tr>
              </thead>
              <tbody>
                {bcaVaTxns.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--blue-light)' }}>{t.va_number}</td>
                    <td style={{ fontSize: '0.82rem' }}>#{t.platform_booking_id}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{t.customer_name}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--lime)', fontWeight: 600 }}>{fmt(t.amount)}</td>
                    <td><StatusPill status={t.status} /></td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {t.expired_at ? new Date(t.expired_at).toLocaleDateString('id-ID') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bcaVaTxns.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>No BCA VA transactions.</div>}
          </div>

          <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', padding: '1.25rem' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.9rem', fontWeight: 700, color: 'var(--white)', marginBottom: '1rem' }}>Confirm VA Payment</h3>
            <form onSubmit={handleConfirmVa}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label>VA Number</label>
                <input type="text" value={confirmVa} onChange={e => setConfirmVa(e.target.value)} required placeholder="70012..." />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label>Payment NTB</label>
                <input type="text" value={confirmNtb} onChange={e => setConfirmNtb(e.target.value)} placeholder="Payment reference" />
              </div>
              {confirmVaMsg && <div className={confirmVaMsg.includes('!') ? 'alert-success' : 'alert-error'} style={{ marginBottom: '0.75rem', fontSize: '0.82rem' }}>{confirmVaMsg}</div>}
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>Confirm</button>
            </form>
          </div>
        </div>
      )}

      {/* BCA TRANSFER */}
      {activeTab === 'bca-transfer' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
          <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', overflow: 'hidden' }}>
            <table>
              <thead>
                <tr>
                  <th>#ID</th>
                  <th>Booking</th>
                  <th>Amount</th>
                  <th>Transfer Ref</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {bcaTfTxns.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>#{t.id}</td>
                    <td style={{ fontSize: '0.82rem' }}>#{t.platform_booking_id}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--lime)', fontWeight: 600 }}>{fmt(t.amount)}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t.transfer_ref || '—'}</td>
                    <td><StatusPill status={t.status} /></td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t.created_at ? new Date(t.created_at).toLocaleDateString('id-ID') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bcaTfTxns.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>No transfer payments.</div>}
          </div>

          <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', padding: '1.25rem' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.9rem', fontWeight: 700, color: 'var(--white)', marginBottom: '1rem' }}>Verify Transfer</h3>
            <form onSubmit={handleVerifyTransfer}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label>Transfer ID</label>
                <input type="number" value={verifyTfId} onChange={e => setVerifyTfId(e.target.value)} required placeholder="#ID" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                <input type="checkbox" id="approved" checked={verifyApproved} onChange={e => setVerifyApproved(e.target.checked)}
                  style={{ width: 'auto', accentColor: 'var(--blue)' }} />
                <label htmlFor="approved" style={{ marginBottom: 0, textTransform: 'none', letterSpacing: 'normal', cursor: 'pointer' }}>Approved</label>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label>Notes</label>
                <textarea rows={2} value={verifyNotes} onChange={e => setVerifyNotes(e.target.value)} placeholder="Optional notes" />
              </div>
              {verifyTfMsg && <div className={verifyTfMsg.includes('!') ? 'alert-success' : 'alert-error'} style={{ marginBottom: '0.75rem', fontSize: '0.82rem' }}>{verifyTfMsg}</div>}
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>Verify</button>
            </form>
          </div>
        </div>
      )}

      {/* RECORD DIRECT PAYMENT */}
      {activeTab === 'direct' && (
        <div style={{ maxWidth: '480px' }}>
          <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', padding: '1.75rem' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--white)', marginBottom: '1.25rem' }}>
              Record Direct Payment
            </h2>
            <form onSubmit={handleDirectPayment}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label>Booking ID</label>
                <input type="number" value={dpBookingId} onChange={e => setDpBookingId(e.target.value)} required placeholder="#" />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label>Payment Method</label>
                <select value={dpMethodCode} onChange={e => setDpMethodCode(e.target.value)}>
                  <option value="CASH">Cash</option>
                  <option value="QRIS">QRIS</option>
                  <option value="CARD">Card</option>
                </select>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label>Amount (IDR)</label>
                <input type="number" value={dpAmount} onChange={e => setDpAmount(e.target.value)} required placeholder="Amount" min="0" />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label>Notes</label>
                <textarea rows={2} value={dpNotes} onChange={e => setDpNotes(e.target.value)} placeholder="Optional notes" />
              </div>
              {dpMsg && <div className={dpMsg.includes('!') ? 'alert-success' : 'alert-error'} style={{ marginBottom: '0.75rem', fontSize: '0.82rem' }}>{dpMsg}</div>}
              <button type="submit" className="btn-primary">Record Payment</button>
            </form>
          </div>
        </div>
      )}

      {/* REFUNDS */}
      {activeTab === 'refunds' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
          <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', overflow: 'hidden' }}>
            <table>
              <thead>
                <tr>
                  <th>#ID</th>
                  <th>Payment</th>
                  <th>Booking</th>
                  <th>Channel</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>#{r.id}</td>
                    <td style={{ fontSize: '0.82rem' }}>#{r.payment_id}</td>
                    <td style={{ fontSize: '0.82rem' }}>#{r.platform_booking_id}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--blue-light)' }}>{r.channel}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--danger)', fontWeight: 600 }}>{fmt(r.amount)}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--muted)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.reason}</td>
                    <td><StatusPill status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {refunds.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>No refunds.</div>}
          </div>

          <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', padding: '1.25rem' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.9rem', fontWeight: 700, color: 'var(--white)', marginBottom: '1rem' }}>Create Refund</h3>
            <form onSubmit={handleCreateRefund}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label>Payment ID</label>
                <input type="number" value={refundPaymentId} onChange={e => setRefundPaymentId(e.target.value)} required placeholder="#" />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label>Booking ID</label>
                <input type="number" value={refundBookingId} onChange={e => setRefundBookingId(e.target.value)} required placeholder="#" />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label>Channel</label>
                <input type="text" value={refundChannel} onChange={e => setRefundChannel(e.target.value)} required placeholder="e.g. gopay, bca_va" />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label>Refund Amount (IDR)</label>
                <input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} required placeholder="Amount" min="0" />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label>Reason</label>
                <textarea rows={2} value={refundReason} onChange={e => setRefundReason(e.target.value)} required placeholder="Reason for refund" />
              </div>
              {refundMsg && <div className={refundMsg.includes('!') ? 'alert-success' : 'alert-error'} style={{ marginBottom: '0.75rem', fontSize: '0.82rem' }}>{refundMsg}</div>}
              <button type="submit" className="btn-danger" style={{ width: '100%' }}>Create Refund</button>
            </form>
          </div>
        </div>
      )}

      {/* CONFIG */}
      {activeTab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: '12px', padding: '1.5rem' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--white)', marginBottom: '1rem' }}>Payment Methods</h3>
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Sort</th>
                </tr>
              </thead>
              <tbody>
                {paymentMethods.map(pm => (
                  <tr key={pm.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--blue-light)', fontWeight: 700 }}>{pm.code}</td>
                    <td style={{ fontSize: '0.875rem' }}>{pm.name}</td>
                    <td>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: pm.is_active ? 'var(--success)' : 'var(--danger)' }}>
                        {pm.is_active ? '● Active' : '● Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>{pm.sort_order}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paymentMethods.length === 0 && (
              <div style={{ color: 'var(--muted)', fontSize: '0.875rem', padding: '1rem 0' }}>No payment methods configured in sportspace_finance DB.</div>
            )}
          </div>

          <div className="alert-info" style={{ fontSize: '0.875rem' }}>
            Bank account and GoPay merchant config are loaded from <code>sportspace_bca.bank_account</code> and <code>sportspace_gopay.merchant_config</code> tables respectively.
          </div>
        </div>
      )}
    </div>
  );
}
