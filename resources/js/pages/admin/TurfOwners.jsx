import { useEffect, useState } from 'react';
import api from '../../api/client';
import Alert from '../../components/Alert';

export default function AdminTurfOwners() {
    const [owners, setOwners] = useState([]);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [busyId, setBusyId] = useState(null);

    const load = async (nextStatus = status) => {
        setLoading(true);
        setError('');
        try {
            const params = {};
            if (nextStatus) params.status = nextStatus;
            const { data } = await api.get('/admin/turf/owners', { params });
            setOwners(data.owners || []);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load owners');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const act = async (id, action) => {
        const paths = {
            approve: `/admin/turf/owners/${id}/approve`,
            suspend: `/admin/turf/owners/${id}/suspend`,
            activate: `/admin/turf/owners/${id}/activate`,
        };
        if (action === 'suspend' && !window.confirm('Suspend this owner?')) return;

        setBusyId(id);
        setError('');
        setMessage('');
        try {
            await api.post(paths[action]);
            const labels = { approve: 'approved', suspend: 'suspended', activate: 'activated' };
            setMessage(`Owner ${labels[action] || action}.`);
            await load();
        } catch (e) {
            setError(e.response?.data?.message || `Failed to ${action}`);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-header-text">
                    <h1 className="page-title">Turf Owners</h1>
                    <p className="page-subtitle">Approve, suspend, or activate venue operators.</p>
                </div>
            </div>

            <div className="tab-bar filter-chips">
                {[
                    { value: '', label: 'All' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'active', label: 'Active' },
                    { value: 'suspended', label: 'Suspended' },
                ].map((opt) => (
                    <button
                        key={opt.value || 'all'}
                        type="button"
                        className={`tab-btn${status === opt.value ? ' active' : ''}`}
                        onClick={() => {
                            setStatus(opt.value);
                            load(opt.value);
                        }}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {error && <Alert type="error">{error}</Alert>}
            {message && <Alert type="success">{message}</Alert>}
            {loading && <p className="muted">Loading…</p>}

            <div className="stack-list">
                {owners.map((o) => (
                    <div key={o.id} className="ui-card list-card">
                        <div>
                            <h3>{o.business_name || o.user?.name || `Owner #${o.id}`}</h3>
                            <p className="muted">{o.user?.name} · {o.user?.email}</p>
                            <span className={`status-pill status-${o.status === 'active' ? 'active' : 'inactive'}`}>
                                {o.status}
                            </span>
                        </div>
                        <div className="row-actions">
                            {o.status !== 'active' && (
                                <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    disabled={busyId === o.id}
                                    onClick={() => act(o.id, o.status === 'suspended' ? 'activate' : 'approve')}
                                >
                                    {o.status === 'suspended' ? 'Activate' : 'Approve'}
                                </button>
                            )}
                            {o.status === 'active' && (
                                <button
                                    type="button"
                                    className="btn btn-sm btn-danger"
                                    disabled={busyId === o.id}
                                    onClick={() => act(o.id, 'suspend')}
                                >
                                    Suspend
                                </button>
                            )}
                            {o.status === 'suspended' && (
                                <button
                                    type="button"
                                    className="btn btn-sm btn-secondary"
                                    disabled={busyId === o.id}
                                    onClick={() => act(o.id, 'activate')}
                                >
                                    Activate
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {!loading && !owners.length && (
                <div className="ui-card"><p className="empty-state">No owners found.</p></div>
            )}
        </div>
    );
}
