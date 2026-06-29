import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import Alert from '../../components/Alert';
import { formatTournamentArea } from '../../utils/tournamentLocation';
import LoaderScreen from '../../components/LoaderScreen';
import { STATUS_LABELS, statusBadgeVariant } from '../../utils/tournamentStatus';

export default function AdminTournamentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const loadData = () => {
        setLoading(true);
        api.get(`/admin/tournaments/${id}`)
            .then((res) => setData(res.data))
            .catch((err) => setError(err.response?.data?.message || 'Failed to load.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const approve = async () => {
        setActionLoading('approve');
        setMessage('');
        setError('');
        try {
            await api.post(`/admin/tournaments/${id}/approve`);
            setMessage('Tournament approved and published for all players.');
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'Approval failed.');
        } finally {
            setActionLoading('');
        }
    };

    const reject = async () => {
        setActionLoading('reject');
        setMessage('');
        setError('');
        try {
            await api.post(`/admin/tournaments/${id}/reject`, { rejection_reason: rejectionReason });
            setMessage('Tournament rejected. Organizer can edit and resubmit.');
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'Rejection failed.');
        } finally {
            setActionLoading('');
        }
    };

    const unpublish = async () => {
        setActionLoading('unpublish');
        setMessage('');
        setError('');
        try {
            await api.post(`/admin/tournaments/${id}/unpublish`);
            setMessage('Tournament moved back to draft and hidden from players.');
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'Unpublish failed.');
        } finally {
            setActionLoading('');
        }
    };

    if (loading) return <LoaderScreen message="Loading tournament..." />;
    if (!data) return <div className="empty-state"><p>Tournament not found.</p></div>;

    const { tournament, interested_players_count } = data;
    const category = tournament.sports_category?.name || tournament.sportsCategory?.name;
    const organizer = tournament.organizer;

    return (
        <div className="page">
            <button type="button" className="back-btn" onClick={() => navigate(-1)}>← Back</button>

            <div className="detail-hero">
                <span className={`badge badge-${statusBadgeVariant(tournament.status)}`}>
                    {STATUS_LABELS[tournament.status] || tournament.status}
                </span>
                <h2 className="detail-title">{tournament.team_name}</h2>
                <p className="detail-location">📍 {formatTournamentArea(tournament)}</p>
                <p className="text-muted">Organizer: {organizer?.name} · {organizer?.email}</p>
            </div>

            <Alert message={error} />
            {message && <Alert type="success" message={message} />}

            {tournament.rejection_reason && (
                <div className="locked-banner">Previous rejection: {tournament.rejection_reason}</div>
            )}

            <div className="stats-row">
                <div className="stat-card">
                    <span className="stat-value">{interested_players_count}</span>
                    <span className="stat-label">Interested</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value">{category}</span>
                    <span className="stat-label">Sport</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value">₹{tournament.entry_fee}</span>
                    <span className="stat-label">Entry Fee</span>
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
                    <a href={tournament.template} target="_blank" rel="noopener noreferrer" className="template-link">
                        📎 View / Download Template
                    </a>
                </section>
            )}

            <div className="action-stack">
                {tournament.status === 'pending_approval' && (
                    <>
                        <button type="button" className="btn btn-primary btn-block" onClick={approve} disabled={actionLoading === 'approve'}>
                            {actionLoading === 'approve' ? 'Approving...' : '✅ Approve & Publish'}
                        </button>
                        <label className="field">
                            <span>Rejection reason (optional)</span>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={2}
                                placeholder="Tell organizer what to fix..."
                            />
                        </label>
                        <button type="button" className="btn btn-danger btn-block" onClick={reject} disabled={actionLoading === 'reject'}>
                            {actionLoading === 'reject' ? 'Rejecting...' : '✕ Reject'}
                        </button>
                    </>
                )}

                {tournament.status === 'published' && (
                    <button type="button" className="btn btn-outline btn-block" onClick={unpublish} disabled={actionLoading === 'unpublish'}>
                        {actionLoading === 'unpublish' ? 'Updating...' : 'Hide from players (move to draft)'}
                    </button>
                )}
            </div>
        </div>
    );
}
