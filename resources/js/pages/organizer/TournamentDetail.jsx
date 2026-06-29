import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import Alert from '../../components/Alert';
import { formatTournamentArea } from '../../utils/tournamentLocation';
import LoaderScreen from '../../components/LoaderScreen';
import { STATUS_LABELS, statusBadgeVariant } from '../../utils/tournamentStatus';

export default function OrganizerTournamentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const loadData = () => {
        setLoading(true);
        api.get(`/organizer/tournaments/${id}`)
            .then((res) => setData(res.data))
            .catch((err) => setError(err.response?.data?.message || 'Failed to load.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const publish = async () => {
        setActionLoading('publish');
        setMessage('');
        setError('');
        try {
            await api.post(`/organizer/tournaments/${id}/publish`);
            setMessage('Submitted for admin approval. You will be notified once reviewed.');
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'Publish failed.');
        } finally {
            setActionLoading('');
        }
    };

    if (loading) return <LoaderScreen message="Loading tournament..." />;
    if (!data) return <div className="empty-state"><p>Tournament not found.</p></div>;

    const { tournament, interested_players_count } = data;
    const category = tournament.sports_category?.name || tournament.sportsCategory?.name;
    const interests = tournament.interests || [];

    return (
        <div className="page">
            <button type="button" className="back-btn" onClick={() => navigate(-1)}>← Back</button>

            <div className="detail-hero">
                <span className={`badge badge-${statusBadgeVariant(tournament.status)}`}>
                    {STATUS_LABELS[tournament.status] || tournament.status}
                </span>
                <h2 className="detail-title">{tournament.team_name}</h2>
                <p className="detail-location">📍 {formatTournamentArea(tournament)}</p>
            </div>

            <Alert message={error} />
            {message && <Alert type="success" message={message} />}

            <div className="stats-row">
                <div className="stat-card">
                    <span className="stat-value">{interested_players_count}</span>
                    <span className="stat-label">Interested</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value">{tournament.slot_count}</span>
                    <span className="stat-label">Slots</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value">₹{tournament.entry_fee}</span>
                    <span className="stat-label">Entry Fee</span>
                </div>
            </div>

            <div className="detail-grid">
                <div className="detail-item">
                    <span className="detail-label">District</span>
                    <span>{tournament.district || '—'}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Pincode</span>
                    <span>{tournament.pincode || '—'}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Sport</span>
                    <span>{category}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Start</span>
                    <span>{new Date(tournament.start_date).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">End</span>
                    <span>{new Date(tournament.winning_date).toLocaleDateString()}</span>
                </div>
            </div>

            {tournament.rules && (
                <section className="detail-section">
                    <h3>Rules</h3>
                    <p className="pre-wrap">{tournament.rules}</p>
                </section>
            )}

            {tournament.template && (
                <section className="detail-section">
                    <h3>Template</h3>
                    <a
                        href={tournament.template}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="template-link"
                    >
                        📎 View / Download Template
                    </a>
                </section>
            )}

            {tournament.rejection_reason && (
                <div className="locked-banner">
                    Rejected by admin: {tournament.rejection_reason}
                </div>
            )}

            {!['pending_approval', 'published'].includes(tournament.status) && (
                <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={publish}
                    disabled={actionLoading === 'publish'}
                >
                    {actionLoading === 'publish'
                        ? 'Submitting...'
                        : tournament.status === 'rejected'
                            ? '🔄 Resubmit for Approval'
                            : '📤 Submit for Admin Approval'}
                </button>
            )}

            {tournament.status === 'pending_approval' && (
                <div className="locked-banner">⏳ Waiting for admin approval before players can see this tournament.</div>
            )}

            {interests.length > 0 && (
                <section className="section">
                    <h2 className="section-title">Interested Players</h2>
                    <ul className="player-list">
                        {interests.map((item) => (
                            <li key={item.id} className="player-item">
                                <span className="avatar sm">{item.player?.name?.charAt(0)}</span>
                                <div>
                                    <strong>{item.player?.name}</strong>
                                    <p className="text-muted">{item.player?.mobile}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
