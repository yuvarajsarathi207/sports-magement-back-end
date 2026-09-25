import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import Alert from '../../components/Alert';
import LoaderScreen from '../../components/LoaderScreen';
import StatusStats from '../../components/StatusStats';

function formatMoney(amount) {
    return Number(amount || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
}

export default function AdminTurfDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/admin/turf/dashboard')
            .then((res) => setData(res.data))
            .catch((err) => setError(err.response?.data?.message || 'Failed to load'));
    }, []);

    if (!data && !error) return <LoaderScreen message="Loading turf dashboard..." />;

    const stats = data?.stats || {};
    const pendingVenues = data?.pending_venues || [];
    const attentionBookings = data?.attention_bookings || [];

    const statusItems = [
        { value: stats.venues || 0, label: 'Venues', icon: '🏟️', tone: 'info' },
        { value: stats.pending_approval || 0, label: 'Pending', icon: '⏳', tone: 'warning' },
        { value: stats.todays_bookings || 0, label: "Today's", icon: '📅', tone: 'neutral' },
        { value: stats.confirmed_upcoming || 0, label: 'Upcoming', icon: '✅', tone: 'success' },
        { value: `₹${formatMoney(stats.revenue)}`, label: 'Revenue', icon: '💰', tone: 'success' },
    ];

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-header-text">
                    <h1 className="page-title" style={{ marginBottom: 0 }}>Turf Dashboard</h1>
                    <p className="page-subtitle">Venue approvals and bookings that need attention.</p>
                </div>
                <div className="page-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/admin/turf/venues')}>
                        Venues
                    </button>
                </div>
            </div>

            {error && <Alert type="error">{error}</Alert>}

            <StatusStats items={statusItems} />

            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">Pending venue approvals</h2>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/admin/turf/venues')}>
                        View all
                    </button>
                </div>
                {pendingVenues.length === 0 ? (
                    <div className="empty-state"><p>No venues awaiting approval.</p></div>
                ) : (
                    <ul className="player-list">
                        {pendingVenues.map((turf) => (
                            <li
                                key={turf.id}
                                className="player-item"
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/admin/turf/${turf.id}`)}
                            >
                                <span className="avatar sm">🏟️</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <strong>{turf.name}</strong>
                                    <p className="text-muted">
                                        {[turf.city, turf.state].filter(Boolean).join(', ')}
                                        {' · '}
                                        {turf.owner?.business_name || turf.owner?.user?.name || 'No owner'}
                                    </p>
                                </div>
                                <span className="badge badge-warning">pending</span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">Bookings needing attention</h2>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/admin/turf/bookings')}>
                        View all
                    </button>
                </div>
                {attentionBookings.length === 0 ? (
                    <div className="empty-state"><p>No active bookings right now.</p></div>
                ) : (
                    <ul className="player-list">
                        {attentionBookings.map((booking) => (
                            <li
                                key={booking.id}
                                className="player-item"
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate('/admin/turf/bookings')}
                            >
                                <span className="avatar sm">📅</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <strong>{booking.turf?.name || 'Venue'}</strong>
                                    <p className="text-muted">
                                        {booking.user?.name || 'Player'}
                                        {booking.turf?.city ? ` · ${booking.turf.city}` : ''}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <strong>₹{formatMoney(booking.total)}</strong>
                                    <div>
                                        <span className={`badge badge-${booking.status === 'held' ? 'warning' : 'success'}`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
