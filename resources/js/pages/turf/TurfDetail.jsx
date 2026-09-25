import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';

function formatTime(iso) {
    try {
        return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return iso;
    }
}

export default function TurfDetail({ basePath = '/turf' }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [turf, setTurf] = useState(null);
    const [courtId, setCourtId] = useState('');
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [manualInfo, setManualInfo] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get(`/turf/venues/${id}`);
                setTurf(data);
                if (data.courts?.length) setCourtId(String(data.courts[0].id));
            } catch (e) {
                setError(e.response?.data?.message || 'Failed to load turf');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const loadAvailability = async () => {
        if (!courtId || !date) return;
        setError('');
        try {
            const { data } = await api.get(`/turf/venues/${id}/availability`, {
                params: { date, court_id: courtId },
            });
            const courtBlock = (data.courts || [])[0];
            setSlots(courtBlock?.availability?.slots || []);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load availability');
        }
    };

    useEffect(() => {
        if (courtId && date) loadAvailability();
    }, [courtId, date]);

    const bookSlot = async (slot) => {
        if (!slot.available || booking) return;
        setBooking(true);
        setMessage('');
        setError('');
        setManualInfo(null);
        try {
            const idempotencyKey = `book_${id}_${courtId}_${slot.starts_at}`;
            const { data } = await api.post('/turf/bookings', {
                court_id: Number(courtId),
                starts_at: slot.starts_at,
                ends_at: slot.ends_at,
                idempotency_key: idempotencyKey,
            }, {
                headers: { 'Idempotency-Key': idempotencyKey },
            });

            const payment = data.payment || {};
            const detailPath = `${basePath}/bookings/${data.id}`;

            if (payment.redirect_url) {
                window.location.href = payment.redirect_url;
                return;
            }

            if (payment.payment_method === 'manual') {
                setManualInfo({
                    bookingId: data.id,
                    instructions: payment.payment_instructions || payment.message || 'Pay offline at the venue and ask them to confirm your booking.',
                    holdExpires: data.hold_expires_at,
                });
                setMessage('Slot held. Complete payment, then wait for venue confirmation.');
                return;
            }

            if (data.status === 'confirmed' || payment.payment_method === 'free' || !payment.requires_payment) {
                navigate(detailPath);
                return;
            }

            // Held (e.g. phonepe pending without redirect) — go to booking detail; do NOT auto confirm-payment
            navigate(detailPath);
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data?.errors?.starts_at?.[0] || 'Booking failed');
            await loadAvailability();
        } finally {
            setBooking(false);
        }
    };

    if (loading) return <p className="page muted">Loading…</p>;
    if (!turf) return <p className="page error-text">{error || 'Not found'}</p>;

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-header-text">
                    <Link to={basePath} className="muted">← Venues</Link>
                    <h1 className="page-title">{turf.name}</h1>
                    <p className="page-subtitle">{turf.address_line1}, {turf.city}</p>
                </div>
            </div>

            <div className="ui-card" style={{ marginBottom: 16 }}>
                <div className="ui-card-body form-grid">
                    <label className="form-field">
                        <span>Court</span>
                        <select className="form-control" value={courtId} onChange={(e) => setCourtId(e.target.value)}>
                            {(turf.courts || []).map((c) => (
                                <option key={c.id} value={c.id}>{c.name} — ₹{c.base_price}</option>
                            ))}
                        </select>
                    </label>
                    <label className="form-field">
                        <span>Date</span>
                        <input
                            className="form-control"
                            type="date"
                            value={date}
                            min={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </label>
                </div>
            </div>

            {message && <p className="success-text">{message}</p>}
            {error && <p className="error-text">{error}</p>}

            {manualInfo && (
                <div className="ui-card ui-card-accent" style={{ marginBottom: 16 }}>
                    <div className="ui-card-header"><h2>Payment instructions</h2></div>
                    <div className="ui-card-body">
                        <p style={{ whiteSpace: 'pre-wrap', marginTop: 0 }}>{manualInfo.instructions}</p>
                        {manualInfo.holdExpires && (
                            <p className="hold-timer muted">
                                Hold expires: {new Date(manualInfo.holdExpires).toLocaleString()}
                            </p>
                        )}
                    </div>
                    <div className="ui-card-footer">
                        <Link className="btn btn-primary" to={`${basePath}/bookings/${manualInfo.bookingId}`}>
                            View booking
                        </Link>
                    </div>
                </div>
            )}

            <div className="ui-card">
                <div className="ui-card-header">
                    <h2>Available slots</h2>
                    <span className="muted" style={{ fontSize: 12 }}>Tap a slot to book</span>
                </div>
                <div className="ui-card-body">
                    <div className="slot-grid">
                        {slots.map((slot) => (
                            <button
                                key={slot.starts_at}
                                type="button"
                                className={`slot-btn ${slot.available ? 'available' : 'booked'}`}
                                disabled={!slot.available || booking}
                                onClick={() => bookSlot(slot)}
                            >
                                <span>{formatTime(slot.starts_at)}</span>
                                <span>₹{slot.price}</span>
                                <span>{slot.available ? (booking ? '…' : 'Book') : 'Taken'}</span>
                            </button>
                        ))}
                    </div>
                    {!slots.length && <p className="empty-state">No slots for this date.</p>}
                </div>
            </div>
        </div>
    );
}
