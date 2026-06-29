import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import TournamentCard from '../../components/TournamentCard';
import CategoryFilter from '../../components/CategoryFilter';
import StatusStats from '../../components/StatusStats';
import LoaderScreen from '../../components/LoaderScreen';

export default function PlayerDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState({ subscriptions: [], interests: [], category_stats: [] });
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

    const statusItems = [
        { value: activeSubs.length, label: 'Active', icon: '✅', tone: 'success' },
        { value: pendingSubs.length, label: 'Pending', icon: '💳', tone: 'warning' },
        { value: data.interests?.length || 0, label: 'Interested', icon: '❤️', tone: 'info' },
    ];

    return (
        <div className="page">
            <StatusStats items={statusItems} />

            <section className="section">
                <CategoryFilter
                    categories={data.category_stats || []}
                    value={categoryId}
                    onChange={(id) => {
                        setCategoryId(id);
                        navigate(id ? `/tournaments?category_id=${id}` : '/tournaments');
                    }}
                    countKey="published_count"
                    label="Browse by sport"
                />
            </section>

            {pendingSubs.length > 0 && (
                <section className="section">
                    <h2 className="section-title">Payment Pending</h2>
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

            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">My Subscriptions</h2>
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
                    <h2 className="section-title">Interested In</h2>
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
        </div>
    );
}
