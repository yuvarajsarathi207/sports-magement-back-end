import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';

function formatRange(startsAt, endsAt) {
    try {
        const start = new Date(startsAt);
        const end = new Date(endsAt);
        return `${start.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
        return startsAt;
    }
}

function HoldCountdown({ expiresAt }) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!expiresAt) return undefined;
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, [expiresAt]);

    if (!expiresAt) return null;
    const ms = new Date(expiresAt).getTime() - now;
    if (ms <= 0) return <p className="hold-timer hold-timer-expired">Hold expired</p>;

    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return (
        <p className="hold-timer">
            Hold expires in {mins}:{String(secs).padStart(2, '0')}
            <span className="muted"> ({new Date(expiresAt).toLocaleTimeString()})</span>
        </p>
    );
}

export default function BookingDetail({ basePath = '/turf' }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const load = async () => {
        setError('');
        try {
            const { data } = await api.get(`/turf/bookings/${id}`);
            setBooking(data);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load booking');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [id]);

    const payment = booking?.payment;
    const isHeld = booking?.status === 'held';
    const method = payment?.payment_method;
    const isPhonePePending = isHeld && method === 'phonepe' && payment?.requires_payment;
    const isManualPending = isHeld && method === 'manual' && payment?.requires_payment;
    const canCancel = booking && ['held', 'confirmed'].includes(booking.status);

    const checkPayment = async () => {
        if (!payment) return;
        setBusy(true);
        setError('');
        setMessage('');
        try {
            if (payment.merchant_order_id) {
                const { data } = await api.post(`/payments/${encodeURIComponent(payment.merchant_order_id)}/status`);
                if (data.booking) {
                    setBooking(data.booking);
                    setMessage(data.booking.status === 'confirmed' ? 'Payment confirmed.' : 'Payment status updated.');
                    return;
                }
            }
            const { data } = await api.post(`/turf/bookings/${id}/confirm-payment`);
            if (data.id || data.status) {
                setBooking(data.id ? data : { ...booking, ...data });
            } else if (data.booking) {
                setBooking(data.booking);
            } else {
                await load();
            }
            setMessage('Payment status checked.');
        } catch (e) {
            setError(e.response?.data?.message || 'Could not check payment status');
            if (e.response?.data?.booking) setBooking(e.response.data.booking);
            else await load();
        } finally {
            setBusy(false);
        }
    };

    const cancel = async () => {
        if (!window.confirm('Cancel this booking?')) return;
        setBusy(true);
        setError('');
        try {
            const { data } = await api.post(`/turf/bookings/${id}/cancel`);
            setBooking(data);
            setMessage('Booking cancelled.');
        } catch (e) {
            setError(e.response?.data?.message || 'Cancel failed');
        } finally {
            setBusy(false);
        }
    };

    const receiptRows = useMemo(() => {
        if (!booking) return [];
        return [
            { label: 'Venue', value: booking.turf?.name },
            { label: 'Address', value: [booking.turf?.address_line1, booking.turf?.city].filter(Boolean).join(', ') },
            { label: 'Status', value: booking.status },
            { label: 'Total', value: `₹${booking.total}` },
            { label: 'Payment', value: payment ? `${payment.payment_method || '—'} · ${payment.status || '—'}` : '—' },
        ];
    }, [booking, payment]);

    if (loading) return <p className="page muted">Loading booking…</p>;
    if (!booking) {
        return (
            <div className="page">
                <p className="error-text">{error || 'Booking not found'}</p>
                <Link to={`${basePath}/bookings`} className="btn btn-secondary">Back to bookings</Link>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-header-text">
                    <Link to={`${basePath}/bookings`} className="muted">← My bookings</Link>
                    <h1 className="page-title">Booking #{booking.id}</h1>
                    <p className="page-subtitle">{booking.turf?.name}</p>
                </div>
                <span className={`status-pill status-${booking.status}`}>{booking.status}</span>
            </div>

            {error && <p className="error-text">{error}</p>}
            {message && <p className="success-text">{message}</p>}

            <div className="ui-card booking-receipt" style={{ marginBottom: 16 }}>
                <div className="ui-card-header">
                    <h2>Receipt</h2>
                    <span className="muted">#{booking.uuid?.slice(0, 8) || booking.id}</span>
                </div>
                <div className="ui-card-body">
                    <dl className="receipt-grid">
                        {receiptRows.map((row) => (
                            <div key={row.label} className="receipt-row">
                                <dt>{row.label}</dt>
                                <dd>{row.value || '—'}</dd>
                            </div>
                        ))}
                    </dl>

                    <h3 style={{ fontSize: 14, margin: '16px 0 8px' }}>Slots</h3>
                    <div className="stack-list">
                        {(booking.items || []).map((item, idx) => (
                            <div key={idx} className="list-card" style={{ padding: 10 }}>
                                <div>
                                    <strong>{item.court_name}</strong>
                                    <p className="muted" style={{ margin: '4px 0 0' }}>
                                        {formatRange(item.starts_at, item.ends_at)}
                                    </p>
                                </div>
                                <span>₹{item.unit_price}</span>
                            </div>
                        ))}
                    </div>

                    {isHeld && booking.hold_expires_at && (
                        <HoldCountdown expiresAt={booking.hold_expires_at} />
                    )}
                </div>
            </div>

            {isPhonePePending && (
                <div className="ui-card" style={{ marginBottom: 16 }}>
                    <div className="ui-card-header"><h2>Payment pending</h2></div>
                    <div className="ui-card-body">
                        <p className="muted" style={{ marginTop: 0 }}>
                            If you finished paying on PhonePe, check status below. Do not book again until this hold expires.
                        </p>
                    </div>
                    <div className="ui-card-footer">
                        <button type="button" className="btn btn-primary" disabled={busy} onClick={checkPayment}>
                            {busy ? 'Checking…' : 'Check payment status'}
                        </button>
                    </div>
                </div>
            )}

            {isManualPending && (
                <div className="ui-card ui-card-accent" style={{ marginBottom: 16 }}>
                    <div className="ui-card-header"><h2>Manual payment</h2></div>
                    <div className="ui-card-body">
                        <p style={{ marginTop: 0, whiteSpace: 'pre-wrap' }}>
                            Pay offline using the venue’s payment instructions, then ask the venue or admin to confirm your booking.
                        </p>
                        <p className="muted">Your slot is held until the timer expires or the venue confirms payment.</p>
                    </div>
                    <div className="ui-card-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            disabled={busy}
                            onClick={() => setMessage("Thanks — we've noted you paid. Ask the venue to confirm.")}
                        >
                            I've paid — ask venue to confirm
                        </button>
                    </div>
                </div>
            )}

            <div className="row-actions" style={{ marginTop: 8 }}>
                {canCancel && (
                    <button type="button" className="btn btn-danger" disabled={busy} onClick={cancel}>
                        Cancel booking
                    </button>
                )}
                <button type="button" className="btn btn-secondary" onClick={() => navigate(`${basePath}/bookings`)}>
                    Back to list
                </button>
            </div>
        </div>
    );
}
