import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import Alert from '../../components/Alert';
import LoaderScreen from '../../components/LoaderScreen';
import TournamentLocationPanel from '../../components/TournamentLocationPanel';
import { getSportIcon } from '../../utils/sportIcons';

export default function PlayerTournamentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [hasInterest, setHasInterest] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [basicRes, dashRes] = await Promise.all([
                api.get(`/player/tournaments/${id}`),
                api.get('/player/dashboard'),
            ]);

            setTournament(basicRes.data);

            const subs = dashRes.data.subscriptions || [];
            const sub = subs.find((s) => String(s.tournament_id) === String(id));
            setSubscription(sub || null);

            const interests = dashRes.data.interests || [];
            setHasInterest(interests.some((i) => String(i.tournament_id) === String(id)));

            if (sub?.status === 'active') {
                try {
                    const detailRes = await api.get(`/player/tournaments/${id}/details`);
                    setTournament(detailRes.data);
                } catch {
                    // keep basic view
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load tournament.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const expressInterest = async () => {
        setActionLoading('interest');
        setMessage('');
        setError('');
        try {
            await api.post(`/player/tournaments/${id}/interest`);
            setHasInterest(true);
            setMessage('Interest registered! The organizer will be notified.');
        } catch (err) {
            setError(err.response?.data?.message || 'Could not express interest.');
        } finally {
            setActionLoading('');
        }
    };

    const subscribe = async () => {
        setActionLoading('subscribe');
        setMessage('');
        setError('');
        try {
            const { data } = await api.post(`/player/tournaments/${id}/subscribe`);
            setSubscription(data);
            setMessage('Subscribed! Complete payment to unlock full details.');
        } catch (err) {
            setError(err.response?.data?.message || 'Could not subscribe.');
        } finally {
            setActionLoading('');
        }
    };

    const pay = async () => {
        if (!subscription) return;
        setActionLoading('pay');
        setMessage('');
        setError('');
        try {
            await api.post(`/player/subscriptions/${subscription.id}/pay`, {
                payment_method: 'card',
                payment_details: { demo: true },
            });
            setMessage('Payment successful! Full details unlocked.');
            const detailRes = await api.get(`/player/tournaments/${id}/details`);
            setTournament(detailRes.data);
            setSubscription((prev) => ({ ...prev, status: 'active' }));
            setHasInterest(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Payment failed.');
        } finally {
            setActionLoading('');
        }
    };

    if (loading) return <LoaderScreen message="Loading tournament..." />;
    if (!tournament) return <div className="empty-state"><p>Tournament not found.</p></div>;

    const category = tournament.sports_category?.name || tournament.sportsCategory?.name;
    const isSubscribed = !!subscription;
    const isActive = subscription?.status === 'active';
    const showFullDetails = isActive;

    return (
        <div className="page">
            <button type="button" className="back-btn" onClick={() => navigate(-1)}>← Back</button>

            <div className="detail-hero detail-hero--player">
                <div className="detail-hero-top">
                    <span className="detail-hero-sport">{getSportIcon(category)}</span>
                    <span className="badge badge-category">{category}</span>
                </div>
                <h2 className="detail-title">{tournament.team_name}</h2>
            </div>

            <Alert message={error} />
            {message && <Alert type="success" message={message} />}

            <TournamentLocationPanel tournament={tournament} unlocked={showFullDetails} />

            <div className="detail-grid">
                <div className="detail-item">
                    <span className="detail-label">Start Date</span>
                    <span>{new Date(tournament.start_date).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Winning Date</span>
                    <span>{new Date(tournament.winning_date).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Slots</span>
                    <span>{tournament.slot_count}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Entry Fee</span>
                    <span className="fee-highlight">₹{tournament.entry_fee}</span>
                </div>
            </div>

            {showFullDetails && tournament.rules && (
                <section className="detail-section">
                    <h3>Rules</h3>
                    <p className="pre-wrap">{tournament.rules}</p>
                </section>
            )}

            {!showFullDetails && (
                <div className="locked-rules-banner">
                    <span>📜</span>
                    <p>Rules and full venue info unlock after payment</p>
                </div>
            )}

            <div className="action-stack">
                {!hasInterest && !isSubscribed && (
                    <button
                        type="button"
                        className="btn btn-outline btn-block"
                        onClick={expressInterest}
                        disabled={actionLoading === 'interest'}
                    >
                        {actionLoading === 'interest' ? 'Saving...' : '❤️ Express Interest'}
                    </button>
                )}

                {hasInterest && !isSubscribed && (
                    <p className="text-muted text-center">You're interested in this tournament</p>
                )}

                {!isSubscribed && (
                    <button
                        type="button"
                        className="btn btn-primary btn-block"
                        onClick={subscribe}
                        disabled={actionLoading === 'subscribe'}
                    >
                        {actionLoading === 'subscribe' ? 'Subscribing...' : 'Subscribe — ₹' + tournament.entry_fee}
                    </button>
                )}

                {isSubscribed && !isActive && (
                    <button
                        type="button"
                        className="btn btn-primary btn-block"
                        onClick={pay}
                        disabled={actionLoading === 'pay'}
                    >
                        {actionLoading === 'pay' ? 'Processing...' : '💳 Pay Entry Fee'}
                    </button>
                )}

                {isActive && (
                    <div className="success-banner">✅ You're registered for this tournament!</div>
                )}
            </div>
        </div>
    );
}
