import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/client';

export default function OwnerVenues() {
    const [venues, setVenues] = useState([]);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/turf/owner/venues');
            setVenues(data || []);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load venues');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const publish = async (id) => {
        setError('');
        setMessage('');
        try {
            const { data } = await api.post(`/turf/owner/venues/${id}/publish`);
            setMessage(
                data.status === 'pending_approval'
                    ? 'Submitted for admin approval. It will go live once approved.'
                    : 'Venue published.'
            );
            await load();
        } catch (e) {
            setError(e.response?.data?.message || 'Publish failed');
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-header-text">
                    <h1 className="page-title">My Venues</h1>
                    <p className="page-subtitle">Manage locations players can book.</p>
                </div>
                <Link to="/turf/owner/venues/new" className="btn btn-primary">Add Venue</Link>
            </div>

            {error && <p className="error-text">{error}</p>}
            {message && <p className="success-text">{message}</p>}
            {loading && <p className="muted">Loading…</p>}

            <div className="stack-list">
                {venues.map((v) => (
                    <div key={v.id} className="ui-card list-card">
                        <div>
                            <h3>{v.name}</h3>
                            <p className="muted">{v.city}, {v.state}</p>
                            <p className="muted">{v.courts?.length || 0} courts</p>
                            <span className={`status-pill status-${v.is_published ? 'active' : 'inactive'}`}>
                                {v.is_published ? 'published' : v.status}
                            </span>
                            {v.status === 'pending_approval' && (
                                <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
                                    Awaiting admin approval before it appears to players.
                                </p>
                            )}
                        </div>
                        <div className="row-actions">
                            <Link className="btn btn-sm btn-secondary" to={`/turf/owner/venues/${v.id}`}>Manage</Link>
                            {!v.is_published && v.status !== 'pending_approval' && (
                                <button type="button" className="btn btn-sm btn-primary" onClick={() => publish(v.id)}>
                                    Publish
                                </button>
                            )}
                            {v.status === 'pending_approval' && (
                                <span className="btn btn-sm btn-secondary" style={{ pointerEvents: 'none', opacity: 0.8 }}>
                                    Pending approval
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {!loading && !venues.length && (
                <div className="ui-card"><p className="empty-state">No venues yet. Add your first location.</p></div>
            )}
        </div>
    );
}
