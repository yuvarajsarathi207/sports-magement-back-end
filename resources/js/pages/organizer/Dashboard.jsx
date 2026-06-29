import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import TournamentCard from '../../components/TournamentCard';
import CategoryFilter from '../../components/CategoryFilter';
import StatusStats from '../../components/StatusStats';
import LoaderScreen from '../../components/LoaderScreen';
import { tournamentBadge } from '../../utils/tournamentStatus';

export default function OrganizerDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState({ tournaments: [], stats: {}, category_stats: [] });
    const [categoryId, setCategoryId] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/organizer/dashboard')
            .then((res) => setData(res.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoaderScreen message="Loading your dashboard..." />;

    const { stats, tournaments, category_stats } = data;
    const filtered = categoryId
        ? tournaments.filter((t) => String(t.sports_category_id) === categoryId)
        : tournaments;

    const statusItems = [
        { value: stats.draft_tournaments || 0, label: 'Draft', icon: '📝', tone: 'neutral' },
        { value: stats.pending_approval || 0, label: 'Pending', icon: '⏳', tone: 'warning' },
        { value: stats.published_tournaments || 0, label: 'Live', icon: '✅', tone: 'success' },
        { value: stats.rejected_tournaments || 0, label: 'Closed', icon: '🚫', tone: 'danger' },
    ];

    return (
        <div className="page">
            <StatusStats items={statusItems} />

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
                <h2 className="section-title">Recent Tournaments</h2>
                {filtered.length === 0 ? (
                    <div className="empty-state">
                        <p>No tournaments yet.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/organizer/tournaments/new')}>
                            Create Tournament
                        </button>
                    </div>
                ) : (
                    <div className="card-list">
                        {filtered.slice(0, 5).map((t) => (
                            <TournamentCard
                                key={t.id}
                                tournament={t}
                                badge={tournamentBadge(t)}
                                onClick={() => navigate(`/organizer/tournaments/${t.id}`)}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
