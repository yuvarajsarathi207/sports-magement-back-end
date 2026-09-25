import { useEffect, useState } from 'react';
import api from '../../../api/client';

const STATUS_OPTIONS = [
    { value: '', label: 'All' },
    { value: 'held', label: 'Held' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'no_show', label: 'No-show' },
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

export default function OwnerBookings() {
    const [bookings, setBookings] = useState([]);
    const [status, setStatus] = useState('');
    const [date, setDate] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);

    const load = async (overrides = {}) => {
        const nextStatus = overrides.status !== undefined ? overrides.status : status;
        const nextDate = overrides.date !== undefined ? overrides.date : date;
        setLoading(true);
        setError('');
        try {
            const params = {};
            if (nextStatus) params.status = nextStatus;
            if (nextDate) params.date = nextDate;
            const { data } = await api.get('/turf/owner/bookings', { params });
            setBookings(data.data || data || []);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const act = async (id, action) => {
        const paths = {
            confirm: `/turf/owner/bookings/${id}/confirm`,
            cancel: `/turf/owner/bookings/${id}/cancel`,
            'no-show': `/turf/owner/bookings/${id}/no-show`,
            complete: `/turf/owner/bookings/${id}/complete`,
        };
        if (action === 'cancel' && !window.confirm('Cancel this booking?')) return;
        if (action === 'confirm' && !window.confirm('Confirm this booking (force manual payment)?')) return;

        setBusyId(id);
        setError('');
        setMessage('');
        try {
            const body = action === 'confirm' ? { force_manual: true } : {};
            await api.post(paths[action], body);
            const labels = {
                confirm: 'confirmed',
                cancel: 'cancelled',
                'no-show': 'marked no-show',
                complete: 'completed',
            };
            setMessage(`Booking ${labels[action] || action}.`);
            await load();
        } catch (e) {
            setError(e.response?.data?.message || `Failed to ${action}`);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-header-text">
                    <h1 className="page-title">Venue Bookings</h1>
                    <p className="page-subtitle">Manage reservations across your venues.</p>
                </div>
            </div>

            <form
                className="ui-card"
                style={{ marginBottom: 16 }}
                onSubmit={(e) => {
                    e.preventDefault();
                    load();
                }}
            >
                <div className="ui-card-body form-grid">
                    <label className="form-field">
                        <span>Status</span>
                        <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
                            {STATUS_OPTIONS.map((o) => (
                                <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </label>
                    <label className="form-field">
                        <span>Date</span>
                        <input className="form-control" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </label>
                </div>
                <div className="ui-card-footer filter-actions">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                            setStatus('');
                            setDate('');
                            load({ status: '', date: '' });
                        }}
                    >
                        Clear
                    </button>
                    <button type="submit" className="btn btn-primary">Filter</button>
                </div>
            </form>

            {loading && <p className="muted">Loading…</p>}
            {error && <p className="error-text">{error}</p>}
            {message && <p className="success-text">{message}</p>}

            <div className="stack-list">
                {bookings.map((b) => (
                    <div key={b.id} className="ui-card list-card">
                        <div>
                            <h3>{b.turf?.name}</h3>
                            <p>
                                {b.user?.name || 'Player'}
                                {' · '}
                                <span className={`status-pill status-${b.status}`}>{b.status}</span>
                                {' · '}₹{b.total}
                            </p>
                            {(b.items || []).map((item, idx) => (
                                <p key={idx} className="muted">
                                    {item.court_name}: {formatRange(item.starts_at, item.ends_at)}
                                </p>
                            ))}
                            {b.payment?.payment_method === 'manual' && b.status === 'held' && (
                                <p className="muted">Manual payment — confirm when paid.</p>
                            )}
                        </div>
                        <div className="row-actions">
                            {b.status === 'held' && (
                                <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    disabled={busyId === b.id}
                                    onClick={() => act(b.id, 'confirm')}
                                >
                                    Confirm
                                </button>
                            )}
                            {['held', 'confirmed'].includes(b.status) && (
                                <button
                                    type="button"
                                    className="btn btn-sm btn-danger"
                                    disabled={busyId === b.id}
                                    onClick={() => act(b.id, 'cancel')}
                                >
                                    Cancel
                                </button>
                            )}
                            {b.status === 'confirmed' && (
                                <>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-secondary"
                                        disabled={busyId === b.id}
                                        onClick={() => act(b.id, 'no-show')}
                                    >
                                        No-show
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-primary"
                                        disabled={busyId === b.id}
                                        onClick={() => act(b.id, 'complete')}
                                    >
                                        Complete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {!loading && !bookings.length && (
                <div className="ui-card"><p className="empty-state">No bookings found.</p></div>
            )}
        </div>
    );
}
