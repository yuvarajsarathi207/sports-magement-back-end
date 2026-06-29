import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import TournamentCard from '../../components/TournamentCard';
import CategoryFilter from '../../components/CategoryFilter';
import LoaderScreen from '../../components/LoaderScreen';
import { tournamentBadge } from '../../utils/tournamentStatus';

export default function AdminTournaments() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [tournaments, setTournaments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [status, setStatus] = useState(searchParams.get('status') || '');
    const [categoryId, setCategoryId] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/sports-categories').then((res) => setCategories(res.data));
    }, []);

    useEffect(() => {
        setLoading(true);
        const params = {};
        if (status) params.status = status;
        if (categoryId) params.category_id = categoryId;

        api.get('/admin/tournaments', { params })
            .then((res) => setTournaments(res.data))
            .finally(() => setLoading(false));
    }, [status, categoryId]);

    return (
        <div className="page">
            <div className="filter-bar">
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="select">
                    <option value="">All Status</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            <CategoryFilter
                categories={categories}
                value={categoryId}
                onChange={setCategoryId}
                label="Filter review queue"
            />

            {loading ? (
                <LoaderScreen message="Loading tournaments..." />
            ) : tournaments.length === 0 ? (
                <div className="empty-state"><p>No tournaments found.</p></div>
            ) : (
                <div className="card-list">
                    {tournaments.map((t) => (
                        <TournamentCard
                            key={t.id}
                            tournament={t}
                            badge={tournamentBadge(t)}
                            onClick={() => navigate(`/admin/tournaments/${t.id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
