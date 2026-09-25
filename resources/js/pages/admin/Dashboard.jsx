import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import TournamentCard from '../../components/TournamentCard';
import StatusStats from '../../components/StatusStats';
import LoaderScreen from '../../components/LoaderScreen';
import { tournamentBadge, publishPathBadge } from '../../utils/tournamentStatus';

function TournamentQueue({ title, emptyText, items, viewAllPath, navigate }) {
    return (
        <section className="section">
            <div className="section-header">
                <h2 className="section-title">{title}</h2>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate(viewAllPath)}>
                    View all
                </button>
            </div>
            {items.length === 0 ? (
                <div className="empty-state"><p>{emptyText}</p></div>
            ) : (
                <div className="card-list">
                    {items.map((t) => (
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
        pending_approval_tournaments: [],
        pending_payment_tournaments: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/dashboard')
            .then((res) => setData(res.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoaderScreen message="Loading admin panel..." />;

    const {
        stats,
        pending_approval_tournaments = [],
        pending_payment_tournaments = [],
    } = data;

    const statusItems = [
        { value: stats.pending_approval || 0, label: 'Approval', icon: '⏳', tone: 'warning' },
        { value: stats.pending_payment || 0, label: 'Payment', icon: '💳', tone: 'warning' },
        { value: stats.published || 0, label: 'Live', icon: '✅', tone: 'success' },
        { value: stats.draft || 0, label: 'Draft', icon: '📝', tone: 'neutral' },
    ];

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-header-text">
                    <h1 className="page-title" style={{ marginBottom: 0 }}>Tournament Dashboard</h1>
                    <p className="page-subtitle">Pending approvals and payments at a glance.</p>
                </div>
                <div className="page-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/admin/tournaments')}>
                        Review queue
                    </button>
                </div>
            </div>

            <StatusStats items={statusItems} />

            <TournamentQueue
                title="Awaiting Approval"
                emptyText="No tournaments pending approval."
                items={pending_approval_tournaments}
                viewAllPath="/admin/tournaments?status=pending_approval"
                navigate={navigate}
            />

            <TournamentQueue
                title="Awaiting Payment"
                emptyText="No tournaments pending payment."
                items={pending_payment_tournaments}
                viewAllPath="/admin/tournaments?status=pending_payment"
                navigate={navigate}
            />
        </div>
    );
}
