import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import TournamentCard from '../../components/TournamentCard';
import CategoryFilter from '../../components/CategoryFilter';
import LoaderScreen from '../../components/LoaderScreen';
import { tournamentBadge, publishPathBadge } from '../../utils/tournamentStatus';

export default function OrganizerTournaments() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [tournaments, setTournaments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [status, setStatus] = useState(searchParams.get('status') || '');
    const [categoryId, setCategoryId] = useState(searchParams.get('category_id') || '');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/sports-categories').then((res) => setCategories(res.data));
    }, []);

    useEffect(() => {
        setStatus(searchParams.get('status') || '');
        setCategoryId(searchParams.get('category_id') || '');
    }, [searchParams]);

    useEffect(() => {
        setLoading(true);
        const params = {};
        if (status) params.status = status;
        if (categoryId) params.category_id = categoryId;

        api.get('/organizer/tournaments', { params })
            .then((res) => setTournaments(res.data))
            .finally(() => setLoading(false));
    }, [status, categoryId]);

    const updateStatus = (value) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set('status', value);
        else next.delete('status');
        setSearchParams(next);
        setStatus(value);
    };

    const updateCategory = (value) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set('category_id', value);
        else next.delete('category_id');
        setSearchParams(next);
        setCategoryId(value);
    };

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-header-text">
                    <h1 className="page-title" style={{ marginBottom: 0 }}>Your events</h1>
                    <p className="page-subtitle">Manage drafts, live tournaments, and player payments.</p>
                </div>
                <div className="page-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/organizer/tournaments/new')}>
                        + Create
                    </button>
                </div>
            </div>

            <div className="filter-bar">
                <select value={status} onChange={(e) => updateStatus(e.target.value)} className="select">
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="pending_payment">Pending Payment</option>
                    <option value="published">Published</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            <CategoryFilter
                categories={categories}
                value={categoryId}
                onChange={updateCategory}
                label="Filter events"
            />

            {loading ? (
                <LoaderScreen message="Loading events..." />
            ) : tournaments.length === 0 ? (
                <div className="empty-state">
                    <p>No tournaments found.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/organizer/tournaments/new')}>
                        Create Tournament
                    </button>
                </div>
            ) : (
                <div className="card-list">
                    {tournaments.map((t) => (
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
        </div>
    );
}
