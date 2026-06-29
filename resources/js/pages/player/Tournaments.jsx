import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import TournamentCard from '../../components/TournamentCard';
import CategoryFilter from '../../components/CategoryFilter';
import LoaderScreen from '../../components/LoaderScreen';

export default function PlayerTournaments() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [tournaments, setTournaments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [categoryId, setCategoryId] = useState(searchParams.get('category_id') || '');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/player/dashboard').then((res) => {
            setCategories(res.data.category_stats || []);
        });
    }, []);

    useEffect(() => {
        setCategoryId(searchParams.get('category_id') || '');
    }, [searchParams]);

    useEffect(() => {
        setLoading(true);
        const params = categoryId ? { category_id: categoryId } : {};
        api.get('/player/tournaments', { params })
            .then((res) => setTournaments(res.data))
            .finally(() => setLoading(false));
    }, [categoryId]);

    return (
        <div className="page">
            <CategoryFilter
                categories={categories}
                value={categoryId}
                onChange={setCategoryId}
                countKey="published_count"
                label="Filter tournaments"
            />

            {loading ? (
                <LoaderScreen message="Loading tournaments..." />
            ) : tournaments.length === 0 ? (
                <div className="empty-state">
                    <p>No published tournaments in this category.</p>
                    <p className="text-muted">Check back soon!</p>
                </div>
            ) : (
                <div className="card-list">
                    {tournaments.map((t) => (
                        <TournamentCard
                            key={t.id}
                            tournament={t}
                            hideLocation
                            onClick={() => navigate(`/tournaments/${t.id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
