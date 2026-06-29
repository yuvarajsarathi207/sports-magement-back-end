import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import TournamentCard from '../../components/TournamentCard';
import CategoryFilter from '../../components/CategoryFilter';
import StatusStats from '../../components/StatusStats';
import LoaderScreen from '../../components/LoaderScreen';
import { tournamentBadge } from '../../utils/tournamentStatus';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState({ stats: {}, category_stats: [], pending_tournaments: [] });
    const [categoryId, setCategoryId] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/dashboard')
            .then((res) => setData(res.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoaderScreen message="Loading admin panel..." />;

    const { stats, category_stats, pending_tournaments } = data;
    const filteredPending = categoryId
        ? pending_tournaments.filter((t) => String(t.sports_category_id) === categoryId)
        : pending_tournaments;

    const statusItems = [
        { value: stats.pending_approval || 0, label: 'Pending', icon: '⏳', tone: 'warning' },
        { value: stats.published || 0, label: 'Live', icon: '✅', tone: 'success' },
        { value: stats.rejected || 0, label: 'Closed', icon: '🚫', tone: 'danger' },
        { value: stats.draft || 0, label: 'Draft', icon: '📝', tone: 'neutral' },
    ];

    return (
        <div className="page">
            <StatusStats items={statusItems} />

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

            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">Awaiting Approval</h2>
                    <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/tournaments?status=pending_approval')}>
                        View all
                    </button>
                </div>
                {filteredPending.length === 0 ? (
                    <div className="empty-state"><p>No tournaments pending approval.</p></div>
                ) : (
                    <div className="card-list">
                        {filteredPending.map((t) => (
                            <TournamentCard
                                key={t.id}
                                tournament={t}
                                badge={tournamentBadge(t)}
                                onClick={() => navigate(`/admin/tournaments/${t.id}`)}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
