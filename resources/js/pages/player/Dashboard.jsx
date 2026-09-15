import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import TournamentCard from '../../components/TournamentCard';
import CategoryFilter from '../../components/CategoryFilter';
import StatusStats from '../../components/StatusStats';
import LoaderScreen from '../../components/LoaderScreen';
import RecommendedProducts from '../../components/shop/RecommendedProducts';

export default function PlayerDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState({
        subscriptions: [],
        interests: [],
        category_stats: [],
        stats: {},
        upcoming: [],
        discover: [],
    });
    const [categoryId, setCategoryId] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/player/dashboard')
            .then((res) => setData(res.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoaderScreen message="Loading your dashboard..." />;

    const activeSubs = data.subscriptions?.filter((s) => s.status === 'active') || [];
    const pendingSubs = data.subscriptions?.filter((s) => s.status === 'pending') || [];
    const upcoming = data.upcoming || [];
    const discover = data.discover || [];
    const stats = data.stats || {};

    const statusItems = [
        { value: stats.active ?? activeSubs.length, label: 'Joined', icon: '✅', tone: 'success' },
        { value: stats.pending ?? pendingSubs.length, label: 'Pay now', icon: '💳', tone: 'warning' },
        { value: stats.interested ?? data.interests?.length ?? 0, label: 'Interested', icon: '❤️', tone: 'info' },
        { value: stats.upcoming ?? upcoming.length, label: 'Upcoming', icon: '📅', tone: 'neutral' },
    ];

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-header-text">
                    <h1 className="page-title" style={{ marginBottom: 0 }}>Your Dashboard</h1>
                    <p className="page-subtitle">Track subscriptions, payments, and find your next match.</p>
                </div>
                <div className="page-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/tournaments')}>
                        Browse tournaments
                    </button>
                </div>
            </div>

            <StatusStats items={statusItems} />

            <RecommendedProducts basePath="/shop" />

            <div className="dashboard-grid">
                <section className="dashboard-panel">
                    <h2 className="dashboard-panel-title">Quick actions</h2>
                    <div className="quick-actions">
                        <button type="button" className="quick-action" onClick={() => navigate('/tournaments')}>
                            <span className="quick-action-icon">🏆</span>
                            <span className="quick-action-label">Browse</span>
                            <span className="quick-action-hint">Find live tournaments</span>
                        </button>
                        <button
                            type="button"
                            className="quick-action"
                            onClick={() => {
                                const el = document.getElementById('my-subscriptions');
                                el?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            <span className="quick-action-icon">🎫</span>
                            <span className="quick-action-label">My events</span>
                            <span className="quick-action-hint">Active subscriptions</span>
                        </button>
                        <button
                            type="button"
                            className="quick-action"
                            onClick={() => {
                                if (pendingSubs[0]) {
                                    navigate(`/tournaments/${pendingSubs[0].tournament_id}`);
                                } else {
                                    navigate('/tournaments');
                                }
                            }}
                        >
                            <span className="quick-action-icon">💳</span>
                            <span className="quick-action-label">Complete pay</span>
                            <span className="quick-action-hint">
                                {pendingSubs.length > 0
                                    ? `${pendingSubs.length} pending`
                                    : 'No pending payments'}
                            </span>
                        </button>
                        <button type="button" className="quick-action" onClick={() => navigate('/profile')}>
                            <span className="quick-action-icon">👤</span>
                            <span className="quick-action-label">Profile</span>
                            <span className="quick-action-hint">Update your details</span>
                        </button>
                    </div>
                </section>

                <section className="dashboard-panel">
                    <h2 className="dashboard-panel-title">Browse by sport</h2>
                    <CategoryFilter
                        categories={data.category_stats || []}
                        value={categoryId}
                        onChange={(id) => {
                            setCategoryId(id);
                            navigate(id ? `/tournaments?category_id=${id}` : '/tournaments');
                        }}
                        countKey="published_count"
                        label=""
                    />
                </section>
            </div>

            {pendingSubs.length > 0 && (
                <section className="section">
                    <h2 className="section-title">Payment pending</h2>
                    <p className="page-subtitle" style={{ marginBottom: 12 }}>
                        Finish payment to unlock venue details and confirm your spot.
                    </p>
                    <div className="card-list">
                        {pendingSubs.map((sub) => (
                            <TournamentCard
                                key={sub.id}
                                tournament={sub.tournament}
                                hideLocation={sub.status !== 'active'}
                                badge={{ text: 'Pay now', variant: 'warning' }}
                                onClick={() => navigate(`/tournaments/${sub.tournament_id}`)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {upcoming.length > 0 && (
                <section className="section">
                    <h2 className="section-title">Upcoming for you</h2>
                    <div className="card-list">
                        {upcoming.map((sub) => (
                            <TournamentCard
                                key={sub.id}
                                tournament={sub.tournament}
                                badge={{ text: 'Joined', variant: 'success' }}
                                onClick={() => navigate(`/tournaments/${sub.tournament_id}`)}
                            />
                        ))}
                    </div>
                </section>
            )}

            <section className="section" id="my-subscriptions">
                <div className="section-header">
                    <h2 className="section-title">My subscriptions</h2>
                </div>
                {activeSubs.length === 0 ? (
                    <div className="empty-state">
                        <p>No active subscriptions yet.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/tournaments')}>
                            Browse Tournaments
                        </button>
                    </div>
                ) : (
                    <div className="card-list">
                        {activeSubs.map((sub) => (
                            <TournamentCard
                                key={sub.id}
                                tournament={sub.tournament}
                                badge={{ text: sub.status, variant: 'success' }}
                                onClick={() => navigate(`/tournaments/${sub.tournament_id}`)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {data.interests?.length > 0 && (
                <section className="section">
                    <h2 className="section-title">Interested in</h2>
                    <div className="card-list">
                        {data.interests.map((item) => (
                            <TournamentCard
                                key={item.id}
                                tournament={item.tournament}
                                hideLocation
                                badge={{ text: 'Interested', variant: 'info' }}
                                onClick={() => navigate(`/tournaments/${item.tournament_id}`)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {discover.length > 0 && (
                <section className="section">
                    <div className="section-header">
                        <h2 className="section-title">Discover more</h2>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/tournaments')}>
                            See all
                        </button>
                    </div>
                    <div className="card-list">
                        {discover.map((t) => (
                            <TournamentCard
                                key={t.id}
                                tournament={t}
                                hideLocation
                                onClick={() => navigate(`/tournaments/${t.id}`)}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
