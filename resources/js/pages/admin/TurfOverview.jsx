import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../api/client';
import Alert from '../../components/Alert';
import LoaderScreen from '../../components/LoaderScreen';

const emptyForm = {
    name: '',
    description: '',
    address_line1: '',
    city: '',
    state: '',
    pincode: '',
    slot_duration_minutes: 60,
    owner_user_id: '',
    business_name: '',
    publish: true,
    court_name: 'Court 1',
    court_base_price: 500,
    sports_category_id: '',
};

export default function AdminTurfOverview() {
    const location = useLocation();
    const [turfs, setTurfs] = useState([]);
    const [pending, setPending] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [sports, setSports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState('all');
    const [section, setSection] = useState(() => (location.pathname.endsWith('/new') ? 'create' : 'venues'));

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const params = { per_page: 50 };
            if (filter === 'published') params.published = 1;
            if (filter === 'draft') params.status = 'draft';
            if (filter === 'pending') params.status = 'pending_approval';

            const [turfRes, pendingRes, ownerRes, sportsRes] = await Promise.all([
                api.get('/admin/turf/venues', { params }),
                api.get('/admin/turf/venues', { params: { status: 'pending_approval', per_page: 50 } }),
                api.get('/admin/turf/owners'),
                api.get('/sports-categories'),
            ]);
            setTurfs(turfRes.data.data || []);
            setPending(pendingRes.data.data || []);
            setCandidates(ownerRes.data.candidates || []);
            setSports(sportsRes.data.categories || sportsRes.data || []);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load turfs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [filter]);

    useEffect(() => {
        if (location.pathname.endsWith('/new')) setSection('create');
    }, [location.pathname]);

    const create = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setMessage('');
        try {
            await api.post('/admin/turf/venues', {
                ...form,
                owner_user_id: form.owner_user_id ? Number(form.owner_user_id) : null,
                court_base_price: Number(form.court_base_price || 0),
                slot_duration_minutes: Number(form.slot_duration_minutes || 60),
                sports_category_id: form.sports_category_id || null,
                publish: !!form.publish,
            });
            setMessage('Turf created successfully');
            setForm(emptyForm);
            await load();
        } catch (err) {
            setError(err.response?.data?.message || 'Create failed');
        } finally {
            setSaving(false);
        }
    };

    const publish = async (id) => {
        try {
            await api.post(`/admin/turf/venues/${id}/publish`);
            setMessage('Turf published');
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Publish failed');
        }
    };

    const unpublish = async (id) => {
        try {
            await api.post(`/admin/turf/venues/${id}/unpublish`);
            setMessage('Turf unpublished');
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Unpublish failed');
        }
    };

    const approve = async (id) => {
        try {
            await api.post(`/admin/turf/venues/${id}/approve`);
            setMessage('Turf approved and published');
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Approve failed');
        }
    };

    const reject = async (id) => {
        const reason = window.prompt('Rejection reason (optional)') || '';
        try {
            await api.post(`/admin/turf/venues/${id}/reject`, { reason: reason || null });
            setMessage('Turf rejected (returned to draft)');
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Reject failed');
        }
    };

    const suspend = async (id) => {
        if (!window.confirm('Suspend this turf? It will be unpublished.')) return;
        try {
            await api.post(`/admin/turf/venues/${id}/suspend`);
            setMessage('Turf suspended');
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Suspend failed');
        }
    };

    const remove = async (id, name) => {
        if (!window.confirm(`Delete turf "${name}"?`)) return;
        try {
            await api.delete(`/admin/turf/venues/${id}`);
            setMessage('Turf deleted');
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed');
        }
    };

    if (loading && !turfs.length && !pending.length) return <LoaderScreen message="Loading turfs..." />;

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-header-text">
                    <h1 className="page-title">Venues</h1>
                    <p className="page-subtitle">Create, approve, and manage all venues.</p>
                </div>
            </div>

            <div className="tab-bar filter-chips">
                {[
                    { id: 'venues', label: 'Venues' },
                    { id: 'pending', label: `Pending (${pending.length})` },
                    { id: 'create', label: 'Create' },
                ].map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        className={`tab-btn${section === t.id ? ' active' : ''}`}
                        onClick={() => setSection(t.id)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {error && <Alert type="error">{error}</Alert>}
            {message && <Alert type="success">{message}</Alert>}

            {section === 'pending' && (
                <div className="ui-card">
                    <div className="ui-card-header"><h2>Pending approval</h2></div>
                    <div className="ui-card-body stack-list">
                        {pending.map((t) => (
                            <div key={t.id} className="list-card">
                                <div>
                                    <h3>{t.name}</h3>
                                    <p className="muted">{t.city}, {t.state}</p>
                                    <p className="muted">
                                        Owner: {t.owner?.business_name || t.owner?.user?.name || '—'}
                                        {' · '}{t.courts?.length || 0} courts
                                    </p>
                                    <span className="status-pill status-inactive">pending_approval</span>
                                </div>
                                <div className="row-actions">
                                    <Link className="btn btn-sm btn-secondary" to={`/admin/turf/${t.id}`}>View</Link>
                                    <button type="button" className="btn btn-sm btn-primary" onClick={() => approve(t.id)}>Approve</button>
                                    <button type="button" className="btn btn-sm btn-danger" onClick={() => reject(t.id)}>Reject</button>
                                </div>
                            </div>
                        ))}
                        {!pending.length && <p className="empty-state">No venues awaiting approval.</p>}
                    </div>
                </div>
            )}

            {section === 'create' && (
                <form className="ui-card" style={{ maxWidth: 720 }} onSubmit={create}>
                    <div className="ui-card-header"><h2>Create turf</h2></div>
                    <div className="ui-card-body form-grid">
                        <label className="form-field form-field-full">
                            <span>Venue name</span>
                            <input className="form-control" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </label>
                        <label className="form-field form-field-full">
                            <span>Description</span>
                            <textarea className="form-control" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        </label>
                        <label className="form-field form-field-full">
                            <span>Address</span>
                            <input className="form-control" required value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} />
                        </label>
                        <label className="form-field">
                            <span>City</span>
                            <input className="form-control" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                        </label>
                        <label className="form-field">
                            <span>State</span>
                            <input className="form-control" required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                        </label>
                        <label className="form-field">
                            <span>Pincode</span>
                            <input className="form-control" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
                        </label>
                        <label className="form-field">
                            <span>Slot minutes</span>
                            <input className="form-control" type="number" min={15} max={240} value={form.slot_duration_minutes} onChange={(e) => setForm({ ...form, slot_duration_minutes: e.target.value })} />
                        </label>
                        <label className="form-field form-field-full">
                            <span>Assign owner (optional)</span>
                            <select className="form-control" value={form.owner_user_id} onChange={(e) => setForm({ ...form, owner_user_id: e.target.value })}>
                                <option value="">Platform / Admin managed</option>
                                {candidates.map((u) => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.email}) · {u.role}</option>
                                ))}
                            </select>
                        </label>
                        <label className="form-field form-field-full">
                            <span>Business name</span>
                            <input className="form-control" placeholder="Defaults to Platform Venues" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
                        </label>
                        <label className="form-field">
                            <span>First court name</span>
                            <input className="form-control" value={form.court_name} onChange={(e) => setForm({ ...form, court_name: e.target.value })} />
                        </label>
                        <label className="form-field">
                            <span>Court price</span>
                            <input className="form-control" type="number" min={0} step="0.01" value={form.court_base_price} onChange={(e) => setForm({ ...form, court_base_price: e.target.value })} />
                        </label>
                        <label className="form-field">
                            <span>Sport</span>
                            <select className="form-control" value={form.sports_category_id} onChange={(e) => setForm({ ...form, sports_category_id: e.target.value })}>
                                <option value="">Any</option>
                                {(Array.isArray(sports) ? sports : []).map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </label>
                        <label className="form-field check-row" style={{ alignItems: 'center', marginTop: 24 }}>
                            <input type="checkbox" checked={form.publish} onChange={(e) => setForm({ ...form, publish: e.target.checked })} />
                            <span>Publish immediately</span>
                        </label>
                    </div>
                    <div className="ui-card-footer">
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Creating…' : 'Create turf'}
                        </button>
                    </div>
                </form>
            )}

            {section === 'venues' && (
                <>
                    <div className="tab-bar filter-chips" style={{ marginBottom: 12 }}>
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'published', label: 'Published' },
                            { id: 'draft', label: 'Draft' },
                            { id: 'pending', label: 'Pending' },
                        ].map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                className={`tab-btn${filter === t.id ? ' active' : ''}`}
                                onClick={() => setFilter(t.id)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="ui-card">
                        <div className="ui-card-header">
                            <h2>All venues ({turfs.length})</h2>
                        </div>
                        <div className="ui-card-body stack-list">
                            {turfs.map((t) => (
                                <div key={t.id} className="list-card">
                                    <div>
                                        <h3>{t.name}</h3>
                                        <p className="muted">{t.city}, {t.state}</p>
                                        <p className="muted">
                                            Owner: {t.owner?.business_name || t.owner?.user?.name || '—'}
                                            {' · '}{t.courts?.length || 0} courts
                                        </p>
                                        <span className={`status-pill ${t.is_published ? 'status-active' : 'status-inactive'}`}>
                                            {t.is_published ? 'published' : t.status}
                                        </span>
                                    </div>
                                    <div className="row-actions">
                                        <Link className="btn btn-sm btn-secondary" to={`/admin/turf/${t.id}`}>Manage</Link>
                                        {t.status === 'pending_approval' && (
                                            <>
                                                <button type="button" className="btn btn-sm btn-primary" onClick={() => approve(t.id)}>Approve</button>
                                                <button type="button" className="btn btn-sm btn-danger" onClick={() => reject(t.id)}>Reject</button>
                                            </>
                                        )}
                                        {t.is_published ? (
                                            <button type="button" className="btn btn-sm btn-secondary" onClick={() => unpublish(t.id)}>Unpublish</button>
                                        ) : t.status !== 'pending_approval' && (
                                            <button type="button" className="btn btn-sm btn-primary" onClick={() => publish(t.id)}>Publish</button>
                                        )}
                                        {t.status !== 'suspended' && (
                                            <button type="button" className="btn btn-sm btn-secondary" onClick={() => suspend(t.id)}>Suspend</button>
                                        )}
                                        <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(t.id, t.name)}>Delete</button>
                                    </div>
                                </div>
                            ))}
                            {!turfs.length && <p className="empty-state">No turfs yet.</p>}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
