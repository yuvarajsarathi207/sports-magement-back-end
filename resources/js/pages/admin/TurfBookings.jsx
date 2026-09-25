import { useEffect, useState } from 'react';
import api from '../../api/client';
import Alert from '../../components/Alert';

const STATUS_OPTIONS = [
    { value: '', label: 'All' },
    { value: 'held', label: 'Held' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'no_show', label: 'No-show' },
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

export default function AdminTurfBookings() {
    const [bookings, setBookings] = useState([]);
    const [status, setStatus] = useState('');
    const [city, setCity] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);

    const load = async (overrides = {}) => {
        const nextStatus = overrides.status !== undefined ? overrides.status : status;
        const nextCity = overrides.city !== undefined ? overrides.city : city;
        setLoading(true);
        setError('');
        try {
            const params = { per_page: 50 };
            if (nextStatus) params.status = nextStatus;
            if (nextCity) params.city = nextCity;
            const { data } = await api.get('/admin/turf/bookings', { params });
            setBookings(data.data || []);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const act = async (id, action) => {
        const paths = {
            confirm: `/admin/turf/bookings/${id}/confirm`,
            cancel: `/admin/turf/bookings/${id}/cancel`,
            'no-show': `/admin/turf/bookings/${id}/no-show`,
            complete: `/admin/turf/bookings/${id}/complete`,
        };
        if (action === 'cancel' && !window.confirm('Cancel this booking?')) return;
        if (action === 'confirm' && !window.confirm('Force-confirm this booking?')) return;

        setBusyId(id);
        setError('');
        setMessage('');
        try {
            await api.post(paths[action]);
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
                    <h1 className="page-title">Turf Bookings</h1>
                    <p className="page-subtitle">Platform-wide booking management.</p>
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
                        <span>City</span>
                        <input className="form-control" placeholder="Filter by city" value={city} onChange={(e) => setCity(e.target.value)} />
                    </label>
                </div>
                <div className="ui-card-footer filter-actions">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                            setStatus('');
                            setCity('');
                            load({ status: '', city: '' });
                        }}
                    >
                        Clear
                    </button>
                    <button type="submit" className="btn btn-primary">Filter</button>
                </div>
            </form>

            {error && <Alert type="error">{error}</Alert>}
            {message && <Alert type="success">{message}</Alert>}
            {loading && <p className="muted">Loading…</p>}

            <div className="stack-list">
                {bookings.map((b) => (
                    <div key={b.id} className="ui-card list-card">
                        <div>
                            <h3>{b.turf?.name} · #{b.id}</h3>
                            <p>
                                {b.user?.name || 'Player'}
                                {' · '}
                                <span className={`status-pill status-${b.status}`}>{b.status}</span>
                                {' · '}₹{b.total}
                            </p>
                            <p className="muted">{b.turf?.city}</p>
                            {(b.items || []).map((item, idx) => (
                                <p key={idx} className="muted">
                                    {item.court_name}: {formatRange(item.starts_at, item.ends_at)}
                                </p>
                            ))}
                        </div>
                        <div className="row-actions">
                            {b.status === 'held' && (
                                <button type="button" className="btn btn-sm btn-primary" disabled={busyId === b.id} onClick={() => act(b.id, 'confirm')}>
                                    Confirm
                                </button>
                            )}
                            {['held', 'confirmed'].includes(b.status) && (
                                <button type="button" className="btn btn-sm btn-danger" disabled={busyId === b.id} onClick={() => act(b.id, 'cancel')}>
                                    Cancel
                                </button>
                            )}
                            {b.status === 'confirmed' && (
                                <>
                                    <button type="button" className="btn btn-sm btn-secondary" disabled={busyId === b.id} onClick={() => act(b.id, 'no-show')}>
                                        No-show
                                    </button>
                                    <button type="button" className="btn btn-sm btn-primary" disabled={busyId === b.id} onClick={() => act(b.id, 'complete')}>
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
