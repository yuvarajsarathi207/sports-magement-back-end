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

function paymentTypeLabel(type) {
    if (type === 'organizer_publish') return 'Publish fee';
    if (type === 'player_subscription') return 'Subscription';
    return type || 'Payment';
}

function paymentStatusVariant(status) {
    if (status === 'completed') return 'success';
    if (status === 'pending') return 'warning';
    if (status === 'failed') return 'danger';
    return 'info';
}

function paymentParty(payment) {
    if (payment.type === 'organizer_publish') {
        return payment.organizer?.name || 'Organizer';
    }
    return payment.player?.name || 'Player';
}

function TournamentQueue({ title, emptyText, items, categoryId, viewAllPath, navigate }) {
    const filtered = categoryId
        ? items.filter((t) => String(t.sports_category_id) === categoryId)
        : items;

    return (
        <section className="section">
            <div className="section-header">
                <h2 className="section-title">{title}</h2>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate(viewAllPath)}>
                    View all
                </button>
            </div>
            {filtered.length === 0 ? (
                <div className="empty-state"><p>{emptyText}</p></div>
            ) : (
                <div className="card-list">
                    {filtered.map((t) => (
                        <TournamentCard
                            key={t.id}
                            tournament={t}
                            badge={tournamentBadge(t)}
                            pathBadge={publishPathBadge(t)}
                            onClick={() => navigate(`/admin/tournaments/${t.id}`)}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState({
        stats: {},
        payment_stats: {},
        category_stats: [],
        pending_approval_tournaments: [],
        pending_payment_tournaments: [],
        recent_payments: [],
    });
    const [categoryId, setCategoryId] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/dashboard')
            .then((res) => setData(res.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoaderScreen message="Loading admin panel..." />;

    const {
        stats,
        payment_stats: paymentStats = {},
        category_stats,
        pending_approval_tournaments = [],
        pending_payment_tournaments = [],
        recent_payments = [],
    } = data;

    const statusItems = [
        { value: stats.pending_approval || 0, label: 'Approval', icon: '⏳', tone: 'warning' },
        { value: stats.pending_payment || 0, label: 'Payment', icon: '💳', tone: 'warning' },
        { value: stats.published || 0, label: 'Live', icon: '✅', tone: 'success' },
        { value: stats.rejected || 0, label: 'Closed', icon: '🚫', tone: 'danger' },
        { value: stats.draft || 0, label: 'Draft', icon: '📝', tone: 'neutral' },
    ];

    const paymentItems = [
        { value: formatMoney(paymentStats.revenue_total), label: 'Revenue (₹)', icon: '💰', tone: 'success' },
        { value: paymentStats.completed || 0, label: 'Paid', icon: '✅', tone: 'success' },
        { value: paymentStats.pending || 0, label: 'Pending Pay', icon: '⏳', tone: 'warning' },
        { value: paymentStats.failed || 0, label: 'Failed', icon: '✕', tone: 'danger' },
    ];

    const publishMode = data.settings?.tournament_publish_mode || stats.publish_mode || 'approval';

    return (
        <div className="page">
            <StatusStats items={statusItems} />

            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">PhonePe Payments</h2>
                </div>
                <StatusStats items={paymentItems} />
                <div className="stats-row" style={{ marginTop: '12px' }}>
                    <div className="stat-card">
                        <span className="stat-value">₹{formatMoney(paymentStats.revenue_publish)}</span>
                        <span className="stat-label">Publish fees</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">₹{formatMoney(paymentStats.revenue_subscription)}</span>
                        <span className="stat-label">Subscriptions</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">{(paymentStats.publish_payments || 0) + (paymentStats.subscription_payments || 0)}</span>
                        <span className="stat-label">Successful pays</span>
                    </div>
                </div>
            </section>

            <section className="section">
                <p className="text-muted">
                    New publish mode: <strong>{publishMode === 'payment' ? 'Payment' : 'Approval'}</strong>
                    {' · '}
                    Existing tournaments keep their own Approval/Payment tag.
                    {' · '}
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/admin/settings')}>
                        Settings
                    </button>
                </p>
            </section>

            <section className="section">
                <CategoryFilter
                    categories={category_stats}
                    value={categoryId}
                    onChange={setCategoryId}
                    countKey="published_count"
                    secondaryCountKey="pending_count"
                    label="Filter by sport"
                />
            </section>

            <TournamentQueue
                title="Awaiting Approval"
                emptyText="No tournaments pending approval."
                items={pending_approval_tournaments}
                categoryId={categoryId}
                viewAllPath="/admin/tournaments?status=pending_approval"
                navigate={navigate}
            />

            <TournamentQueue
                title="Awaiting Payment"
                emptyText="No tournaments pending payment."
                items={pending_payment_tournaments}
                categoryId={categoryId}
                viewAllPath="/admin/tournaments?status=pending_payment"
                navigate={navigate}
            />

            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">Recent Payments</h2>
                </div>
                {recent_payments.length === 0 ? (
                    <div className="empty-state"><p>No payments yet.</p></div>
                ) : (
                    <ul className="player-list">
                        {recent_payments.map((payment) => (
                            <li key={payment.id} className="player-item">
                                <span className="avatar sm">₹</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <strong>{paymentParty(payment)}</strong>
                                    <p className="text-muted">
                                        {paymentTypeLabel(payment.type)}
                                        {payment.tournament?.team_name ? ` · ${payment.tournament.team_name}` : ''}
                                    </p>
                                    <p className="text-muted" style={{ fontSize: '12px' }}>
                                        {payment.created_at
                                            ? new Date(payment.created_at).toLocaleString('en-IN')
                                            : ''}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <strong>₹{formatMoney(payment.amount)}</strong>
                                    <div>
                                        <span className={`badge badge-${paymentStatusVariant(payment.status)}`}>
                                            {payment.status}
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
