import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import TournamentCard from '../../components/TournamentCard';
import CategoryFilter from '../../components/CategoryFilter';
import StatusStats from '../../components/StatusStats';
import LoaderScreen from '../../components/LoaderScreen';
import { tournamentBadge, publishPathBadge } from '../../utils/tournamentStatus';

function formatMoney(amount) {
    return Number(amount || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
}

function PlayerRow({ item, amount, badge }) {
    const player = item.player;
    const tournament = item.tournament;

    return (
        <li className="player-item">
            <span className="avatar sm">{player?.name?.charAt(0) || '?'}</span>
            <div className="player-item-meta">
                <strong>{player?.name || 'Player'}</strong>
                <p className="text-muted">{player?.mobile || player?.email || '—'}</p>
                {tournament?.team_name && (
                    <p className="text-muted" style={{ fontSize: '12px' }}>{tournament.team_name}</p>
                )}
            </div>
            <div className="player-item-right">
                {amount != null && <span className="player-item-amount">₹{formatMoney(amount)}</span>}
                {badge && <span className={`badge badge-${badge.variant}`}>{badge.text}</span>}
            </div>
        </li>
    );
}

export default function OrganizerDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState({
        tournaments: [],
        stats: {},
        category_stats: [],
        recent_paid_players: [],
        pending_players: [],
        upcoming_tournaments: [],
        needs_attention: [],
    });
    const [categoryId, setCategoryId] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/organizer/dashboard')
            .then((res) => setData(res.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoaderScreen message="Loading your dashboard..." />;

    const {
        stats,
        tournaments,
        category_stats,
        recent_paid_players = [],
        pending_players = [],
        upcoming_tournaments = [],
        needs_attention = [],
    } = data;

    const filtered = categoryId
        ? tournaments.filter((t) => String(t.sports_category_id) === categoryId)
        : tournaments;

    const statusItems = [
        { value: stats.published_tournaments || 0, label: 'Live', icon: '✅', tone: 'success' },
        { value: stats.paid_players || 0, label: 'Paid players', icon: '💰', tone: 'success' },
        { value: stats.pending_players || 0, label: 'Awaiting pay', icon: '💳', tone: 'warning' },
        { value: stats.total_interested || 0, label: 'Interested', icon: '❤️', tone: 'info' },
        { value: stats.pending_approval || 0, label: 'Pending', icon: '⏳', tone: 'warning' },
        { value: stats.draft_tournaments || 0, label: 'Drafts', icon: '📝', tone: 'neutral' },
    ];

    const slotsFilled = stats.slots_filled || 0;
    const totalSlots = stats.total_slots || 0;
    const slotPct = totalSlots > 0 ? Math.min(100, Math.round((slotsFilled / totalSlots) * 100)) : 0;

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-header-text">
                    <h1 className="page-title" style={{ marginBottom: 0 }}>Organizer Dashboard</h1>
                    <p className="page-subtitle">Track payments, fill slots, and manage your events.</p>
                </div>
                <div className="page-actions">
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/organizer/tournaments')}>
                        All events
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/organizer/tournaments/new')}>
                        + Create tournament
                    </button>
                </div>
            </div>

            <StatusStats items={statusItems} />

            <div className="money-stat">
                <span className="money-stat-label">Entry fees collected</span>
                <span className="money-stat-value">₹{formatMoney(stats.entry_fee_collected)}</span>
                <span className="money-stat-hint">
                    From {stats.paid_players || 0} paid player{stats.paid_players === 1 ? '' : 's'}
                    {totalSlots > 0 ? ` · ${slotsFilled}/${totalSlots} slots filled (${slotPct}%)` : ''}
                </span>
                {totalSlots > 0 && (
                    <div className="slot-meter" style={{ marginTop: 12 }}>
                        <div className="slot-meter-bar">
                            <div className="slot-meter-fill" style={{ width: `${slotPct}%` }} />
                        </div>
                    </div>
                )}
            </div>

            <div className="dashboard-grid">
                <section className="dashboard-panel">
                    <h2 className="dashboard-panel-title">Quick actions</h2>
                    <div className="quick-actions">
                        <button type="button" className="quick-action" onClick={() => navigate('/organizer/tournaments/new')}>
                            <span className="quick-action-icon">➕</span>
                            <span className="quick-action-label">New event</span>
                            <span className="quick-action-hint">Create & publish a tournament</span>
                        </button>
                        <button type="button" className="quick-action" onClick={() => navigate('/organizer/tournaments')}>
                            <span className="quick-action-icon">📋</span>
                            <span className="quick-action-label">Manage events</span>
                            <span className="quick-action-hint">Edit drafts & live events</span>
                        </button>
                        <button
                            type="button"
                            className="quick-action"
                            onClick={() => navigate('/organizer/tournaments?status=published')}
                        >
                            <span className="quick-action-icon">👥</span>
                            <span className="quick-action-label">See players</span>
                            <span className="quick-action-hint">Paid & interested lists</span>
                        </button>
                        <button type="button" className="quick-action" onClick={() => navigate('/organizer/profile')}>
                            <span className="quick-action-icon">👤</span>
                            <span className="quick-action-label">Profile</span>
                            <span className="quick-action-hint">Account & policies</span>
                        </button>
                    </div>
                </section>

                <section className="dashboard-panel">
                    <div className="section-header" style={{ marginBottom: 12 }}>
                        <h2 className="dashboard-panel-title" style={{ marginBottom: 0 }}>Needs attention</h2>
                    </div>
                    {needs_attention.length === 0 ? (
                        <p className="text-muted">All clear — no drafts or pending items.</p>
                    ) : (
                        <div className="card-list card-list--stack">
                            {needs_attention.map((t) => (
                                <TournamentCard
                                    key={t.id}
                                    tournament={t}
                                    badge={tournamentBadge(t)}
                                    pathBadge={publishPathBadge(t)}
                                    onClick={() => navigate(`/organizer/tournaments/${t.id}`)}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <div className="dashboard-grid">
                <section className="dashboard-panel">
                    <div className="section-header" style={{ marginBottom: 12 }}>
                        <h2 className="dashboard-panel-title" style={{ marginBottom: 0 }}>Recently paid</h2>
                        <span className="badge badge-success">{stats.paid_players || 0} paid</span>
                    </div>
                    {recent_paid_players.length === 0 ? (
                        <p className="text-muted">No paid players yet. Publish an event to start collecting entries.</p>
                    ) : (
                        <ul className="player-list">
                            {recent_paid_players.map((item) => (
                                <PlayerRow
                                    key={item.id}
                                    item={item}
                                    amount={item.tournament?.entry_fee}
                                    badge={{ text: 'Paid', variant: 'success' }}
                                />
                            ))}
                        </ul>
                    )}
                </section>

                <section className="dashboard-panel">
                    <div className="section-header" style={{ marginBottom: 12 }}>
                        <h2 className="dashboard-panel-title" style={{ marginBottom: 0 }}>Payment pending</h2>
                        <span className="badge badge-warning">{stats.pending_players || 0}</span>
                    </div>
                    {pending_players.length === 0 ? (
                        <p className="text-muted">No players waiting to pay.</p>
                    ) : (
                        <ul className="player-list">
                            {pending_players.map((item) => (
                                <PlayerRow
                                    key={item.id}
                                    item={item}
                                    badge={{ text: 'Pending', variant: 'warning' }}
                                />
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            {upcoming_tournaments.length > 0 && (
                <section className="section">
                    <h2 className="section-title">Upcoming live events</h2>
                    <div className="card-list">
                        {upcoming_tournaments.map((t) => (
                            <TournamentCard
                                key={t.id}
                                tournament={t}
                                badge={tournamentBadge(t)}
                                pathBadge={publishPathBadge(t)}
                                onClick={() => navigate(`/organizer/tournaments/${t.id}`)}
                            />
                        ))}
                    </div>
                </section>
            )}

            <section className="section">
                <CategoryFilter
                    categories={category_stats}
                    value={categoryId}
                    onChange={setCategoryId}
                    countKey="tournament_count"
                    label="Your tournaments by sport"
                />
            </section>

            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">Recent tournaments</h2>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/organizer/tournaments')}>
                        View all
                    </button>
                </div>
                {filtered.length === 0 ? (
                    <div className="empty-state">
                        <p>No tournaments yet.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/organizer/tournaments/new')}>
                            Create Tournament
                        </button>
                    </div>
                ) : (
                    <div className="card-list">
                        {filtered.slice(0, 6).map((t) => (
                            <TournamentCard
                                key={t.id}
                                tournament={t}
                                badge={tournamentBadge(t)}
                                pathBadge={publishPathBadge(t)}
                                onClick={() => navigate(`/organizer/tournaments/${t.id}`)}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
