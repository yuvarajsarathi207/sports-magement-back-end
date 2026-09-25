import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

const STATUS_OPTIONS = [
    { value: '', label: 'All' },
    { value: 'held', label: 'Held' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'expired', label: 'Expired' },
];

function formatRange(startsAt, endsAt) {
    try {
        const start = new Date(startsAt);
        const end = new Date(endsAt);
        return `${start.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
        return startsAt;
    }
}

export default function MyBookings({ basePath = '/turf' }) {
    const [bookings, setBookings] = useState([]);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const load = async (nextStatus = status) => {
        setLoading(true);
        setError('');
        try {
            const params = {};
            if (nextStatus) params.status = nextStatus;
            const { data } = await api.get('/turf/bookings', { params });
            setBookings(data.data || []);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const cancel = async (id) => {
        if (!window.confirm('Cancel this booking?')) return;
        try {
            await api.post(`/turf/bookings/${id}/cancel`);
            await load();
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data?.errors?.booking?.[0] || 'Cancel failed');
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-header-text">
                    <h1 className="page-title">My Bookings</h1>
                    <p className="page-subtitle">Upcoming and past turf reservations.</p>
                </div>
            </div>

            <div className="tab-bar filter-chips" role="tablist">
                {STATUS_OPTIONS.map((opt) => (
                    <button
                        key={opt.value || 'all'}
                        type="button"
                        className={`tab-btn${status === opt.value ? ' active' : ''}`}
                        onClick={() => {
                            setStatus(opt.value);
                            load(opt.value);
                        }}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {loading && <p className="muted">Loading…</p>}
            {error && <p className="error-text">{error}</p>}

            <div className="stack-list">
                {bookings.map((b) => (
                    <div key={b.id} className="ui-card list-card">
                        <div>
                            <h3>
                                <Link to={`${basePath}/bookings/${b.id}`}>{b.turf?.name || `Booking #${b.id}`}</Link>
                            </h3>
                            <p>
                                <span className={`status-pill status-${b.status}`}>{b.status}</span>
                                {' · '}₹{b.total}
                            </p>
                            {(b.items || []).map((item, idx) => (
                                <p key={idx} className="muted">
                                    {item.court_name}: {formatRange(item.starts_at, item.ends_at)}
                                </p>
                            ))}
                            {b.status === 'held' && b.hold_expires_at && (
                                <p className="hold-timer muted">Hold until {new Date(b.hold_expires_at).toLocaleString()}</p>
                            )}
                        </div>
                        <div className="row-actions">
                            <Link className="btn btn-sm btn-secondary" to={`${basePath}/bookings/${b.id}`}>Details</Link>
                            {['held', 'confirmed'].includes(b.status) && (
                                <button type="button" className="btn btn-sm btn-danger" onClick={() => cancel(b.id)}>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {!loading && !bookings.length && (
                <div className="ui-card"><p className="empty-state">No bookings yet.</p></div>
            )}
        </div>
    );
}
