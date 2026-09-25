import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/client';

export default function OwnerDashboard() {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get('/turf/owner/dashboard');
                setStats(data);
            } catch (e) {
                setError(e.response?.data?.message || 'Create a venue to get started.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const cards = stats ? [
        { label: 'Venues', value: stats.turfs_count ?? stats.turfs },
        { label: 'Courts', value: stats.courts_count ?? stats.courts },
        { label: 'Published', value: stats.published_count ?? stats.published },
        { label: "Today's bookings", value: stats.todays_bookings_count },
        { label: 'Confirmed upcoming', value: stats.confirmed_upcoming_count },
        { label: 'Revenue', value: `₹${Number(stats.revenue || 0).toLocaleString()}` },
    ] : [];

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-header-text">
                    <h1 className="page-title">Turf Owner Dashboard</h1>
                    <p className="page-subtitle">Overview of your venues and bookings.</p>
                </div>
                <Link to="/turf/owner/venues/new" className="btn btn-primary">Add Venue</Link>
            </div>

            {loading && <p className="muted">Loading…</p>}
            {error && <p className="muted">{error}</p>}

            {stats && (
                <div className="stat-grid turf-stat-grid">
                    {cards.map((c) => (
                        <div key={c.label} className="ui-card stat-card">
                            <p className="muted" style={{ margin: 0 }}>{c.label}</p>
                            <h3>{c.value ?? 0}</h3>
                        </div>
                    ))}
                </div>
            )}

            <div className="ui-grid-2" style={{ marginTop: 8 }}>
                <Link to="/turf/owner/venues" className="ui-card entity-card">
                    <h3>Manage venues</h3>
                    <p className="muted">Courts, hours, pricing, and publish</p>
                </Link>
                <Link to="/turf/owner/bookings" className="ui-card entity-card">
                    <h3>Venue bookings</h3>
                    <p className="muted">Confirm, cancel, complete, or mark no-show</p>
                </Link>
            </div>
        </div>
    );
}
