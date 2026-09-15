import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import Alert from '../../components/Alert';
import { formatTournamentArea } from '../../utils/tournamentLocation';
import LoaderScreen from '../../components/LoaderScreen';
import { STATUS_LABELS, statusBadgeVariant, publishPathBadge, resolvePublishPath } from '../../utils/tournamentStatus';

function formatMoney(amount) {
    return Number(amount || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
}

function PlayerList({ items, emptyText, badge, showFee, onConfirmPaid, confirmingId }) {
    if (!items?.length) {
        return <p className="text-muted">{emptyText}</p>;
    }

    return (
        <ul className="player-list">
            {items.map((item) => (
                <li key={item.id} className="player-item">
                    <span className="avatar sm">{item.player?.name?.charAt(0) || '?'}</span>
                    <div className="player-item-meta">
                        <strong>{item.player?.name || 'Player'}</strong>
                        <p className="text-muted">{item.player?.mobile || item.player?.email || '—'}</p>
                        {item.created_at && (
                            <p className="text-muted" style={{ fontSize: '12px' }}>
                                {new Date(item.created_at).toLocaleString('en-IN')}
                            </p>
                        )}
                    </div>
                    <div className="player-item-right">
                        {showFee != null && (
                            <span className="player-item-amount">₹{formatMoney(showFee)}</span>
                        )}
                        {badge && <span className={`badge badge-${badge.variant}`}>{badge.text}</span>}
                        {onConfirmPaid && (
                            <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                style={{ marginTop: 8 }}
                                onClick={() => onConfirmPaid(item.id)}
                                disabled={confirmingId === item.id}
                            >
                                {confirmingId === item.id ? 'Confirming...' : 'Mark paid'}
                            </button>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
}

export default function OrganizerTournamentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [playerTab, setPlayerTab] = useState('paid');
    const [confirmingId, setConfirmingId] = useState('');

    const loadData = () => {
        setLoading(true);
        Promise.all([
            api.get(`/organizer/tournaments/${id}`),
            api.get('/settings/public'),
        ])
            .then(([tournamentRes, settingsRes]) => {
                setData(tournamentRes.data);
                setSettings(settingsRes.data);
            })
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
            const { data: result } = await api.post(`/organizer/tournaments/${id}/publish`);
            if (result.redirect_url) {
                window.location.href = result.redirect_url;
                return;
            }
            if (result.payment_method === 'manual') {
                setMessage(
                    result.message
                    || 'Follow the offline payment instructions. Admin/you can confirm once settled.'
                );
                if (result.payment_instructions) {
                    setMessage(`${result.message}\n\n${result.payment_instructions}`);
                }
                if (result.settings) setSettings(result.settings);
                loadData();
                return;
            }
            setMessage(result.message || 'Tournament published.');
            if (result.settings) setSettings(result.settings);
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'Publish failed.');
        } finally {
            setActionLoading('');
        }
    };

    const confirmPaid = async (subscriptionId) => {
        setConfirmingId(subscriptionId);
        setMessage('');
        setError('');
        try {
            const { data } = await api.post(
                `/organizer/tournaments/${id}/subscriptions/${subscriptionId}/confirm-payment`
            );
            setMessage(data.message || 'Player marked as paid.');
            setPlayerTab('paid');
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'Could not confirm payment.');
        } finally {
            setConfirmingId('');
        }
    };

    if (loading) return <LoaderScreen message="Loading tournament..." />;
    if (!data) return <div className="empty-state"><p>Tournament not found.</p></div>;

    const {
        tournament,
        interested_players_count = 0,
        paid_players_count = 0,
        pending_players_count = 0,
        slots_remaining = 0,
        entry_fee_collected = 0,
        paid_players = [],
        pending_players = [],
    } = data;

    const category = tournament.sports_category?.name || tournament.sportsCategory?.name;
    const interests = tournament.interests || [];
    const isPaymentMode = settings?.tournament_publish_mode === 'payment';
    const publishFee = Number(settings?.organizer_publish_fee || 0);
    const path = resolvePublishPath(tournament);
    const pathBadge = publishPathBadge(tournament);
    const isApprovalQueued = tournament.status === 'pending_approval' || path === 'approval' && tournament.status === 'rejected';
    const canPublish = ['draft', 'rejected', 'pending_payment'].includes(tournament.status)
        && tournament.status !== 'pending_approval';

    let publishLabel = '📤 Submit for Admin Approval';
    if (isPaymentMode && !isApprovalQueued) {
        publishLabel = publishFee > 0
            ? `💳 Pay ₹${publishFee} to Publish`
            : '📤 Publish Tournament';
        if (tournament.status === 'pending_payment') {
            publishLabel = publishFee > 0
                ? `💳 Retry Payment — ₹${publishFee}`
                : '📤 Publish Tournament';
        } else if (tournament.status === 'rejected') {
            publishLabel = publishFee > 0
                ? `💳 Pay ₹${publishFee} & Republish`
                : '🔄 Republish Tournament';
        }
    } else if (tournament.status === 'rejected') {
        publishLabel = '🔄 Resubmit for Approval';
    }

    const slotPct = tournament.slot_count > 0
        ? Math.min(100, Math.round((paid_players_count / tournament.slot_count) * 100))
        : 0;

    return (
        <div className="page">
            <button type="button" className="back-btn" onClick={() => navigate(-1)}>← Back</button>

            <div className="page-header">
                <div className="page-header-text">
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {pathBadge && (
                            <span className={`badge badge-${pathBadge.variant}`}>{pathBadge.text}</span>
                        )}
                        <span className={`badge badge-${statusBadgeVariant(tournament.status)}`}>
                            {STATUS_LABELS[tournament.status] || tournament.status}
                        </span>
                    </div>
                    <h2 className="detail-title" style={{ marginTop: 0 }}>{tournament.team_name}</h2>
                    <p className="detail-location">📍 {formatTournamentArea(tournament)}</p>
                </div>
            </div>

            <Alert message={error} />
            {message && <Alert type="success" message={message} />}

            <div className="stats-row">
                <div className="stat-card">
                    <span className="stat-value">{paid_players_count}</span>
                    <span className="stat-label">Paid</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value">{pending_players_count}</span>
                    <span className="stat-label">Pending pay</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value">{interested_players_count}</span>
                    <span className="stat-label">Interested</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value">{slots_remaining}</span>
                    <span className="stat-label">Slots left</span>
                </div>
            </div>

            <div className="money-stat">
                <span className="money-stat-label">Entry fees collected</span>
                <span className="money-stat-value">₹{formatMoney(entry_fee_collected)}</span>
                <span className="money-stat-hint">
                    ₹{formatMoney(tournament.entry_fee)} × {paid_players_count} paid
                    {' · '}{paid_players_count}/{tournament.slot_count} slots filled
                </span>
                <div className="slot-meter" style={{ marginTop: 12 }}>
                    <div className="slot-meter-bar">
                        <div className="slot-meter-fill" style={{ width: `${slotPct}%` }} />
                    </div>
                    <p className="slot-meter-text">{slotPct}% full</p>
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
                    <span className="detail-label">Entry fee</span>
                    <span className="fee-highlight">₹{formatMoney(tournament.entry_fee)}</span>
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

            {canPublish && (
                <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={publish}
                    disabled={actionLoading === 'publish'}
                    style={{ marginBottom: 16 }}
                >
                    {actionLoading === 'publish' ? 'Processing...' : publishLabel}
                </button>
            )}

            {tournament.status === 'pending_approval' && (
                <div className="locked-banner">⏳ Waiting for admin approval before players can see this tournament.</div>
            )}

            {tournament.status === 'pending_payment' && (
                <div className="locked-banner">💳 Waiting for publish payment before this tournament goes live.</div>
            )}

            <section className="section">
                <h2 className="section-title">Players</h2>
                <div className="player-tabs" role="tablist">
                    <button
                        type="button"
                        className={`player-tab${playerTab === 'paid' ? ' active' : ''}`}
                        onClick={() => setPlayerTab('paid')}
                    >
                        Paid ({paid_players_count})
                    </button>
                    <button
                        type="button"
                        className={`player-tab${playerTab === 'pending' ? ' active' : ''}`}
                        onClick={() => setPlayerTab('pending')}
                    >
                        Pending ({pending_players_count})
                    </button>
                    <button
                        type="button"
                        className={`player-tab${playerTab === 'interested' ? ' active' : ''}`}
                        onClick={() => setPlayerTab('interested')}
                    >
                        Interested ({interested_players_count})
                    </button>
                </div>

                {playerTab === 'paid' && (
                    <PlayerList
                        items={paid_players}
                        emptyText="No paid players yet."
                        badge={{ text: 'Paid', variant: 'success' }}
                        showFee={tournament.entry_fee}
                    />
                )}
                {playerTab === 'pending' && (
                    <PlayerList
                        items={pending_players}
                        emptyText="No players waiting to pay."
                        badge={{ text: 'Pending', variant: 'warning' }}
                        onConfirmPaid={confirmPaid}
                        confirmingId={confirmingId}
                    />
                )}
                {playerTab === 'interested' && (
                    <PlayerList
                        items={interests}
                        emptyText="No interested players yet."
                        badge={{ text: 'Interested', variant: 'info' }}
                    />
                )}
            </section>
        </div>
    );
}
