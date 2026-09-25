import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client';
import Alert from '../../components/Alert';
import LoaderScreen from '../../components/LoaderScreen';

export default function AdminTurfDetail() {
    const { id } = useParams();
    const [turf, setTurf] = useState(null);
    const [sports, setSports] = useState([]);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [courtForm, setCourtForm] = useState({ name: '', base_price: 500, sports_category_id: '' });
    const [editForm, setEditForm] = useState(null);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        try {
            const [{ data }, sportsRes] = await Promise.all([
                api.get(`/admin/turf/venues/${id}`),
                api.get('/sports-categories'),
            ]);
            setTurf(data.turf);
            setEditForm({
                name: data.turf.name || '',
                description: data.turf.description || '',
                address_line1: data.turf.address_line1 || '',
                city: data.turf.city || '',
                state: data.turf.state || '',
                pincode: data.turf.pincode || '',
                slot_duration_minutes: data.turf.slot_duration_minutes || 60,
            });
            setSports(sportsRes.data.categories || sportsRes.data || []);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load turf');
        }
    };

    useEffect(() => { load(); }, [id]);

    const saveTurf = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const { data } = await api.put(`/admin/turf/venues/${id}`, editForm);
            setTurf(data.turf);
            setMessage('Turf updated');
        } catch (err) {
            setError(err.response?.data?.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    const addCourt = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post(`/admin/turf/venues/${id}/courts`, {
                name: courtForm.name,
                base_price: Number(courtForm.base_price),
                sports_category_id: courtForm.sports_category_id || null,
            });
            setCourtForm({ name: '', base_price: 500, sports_category_id: '' });
            setMessage('Court added');
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add court');
        }
    };

    const approve = async () => {
        setError('');
        try {
            const { data } = await api.post(`/admin/turf/venues/${id}/approve`);
            setTurf(data.turf);
            setMessage('Turf approved and published');
        } catch (err) {
            setError(err.response?.data?.message || 'Approve failed');
        }
    };

    const reject = async () => {
        const reason = window.prompt('Rejection reason (optional)') || '';
        setError('');
        try {
            const { data } = await api.post(`/admin/turf/venues/${id}/reject`, { reason: reason || null });
            setTurf(data.turf);
            setMessage('Turf rejected (draft)');
        } catch (err) {
            setError(err.response?.data?.message || 'Reject failed');
        }
    };

    const suspend = async () => {
        if (!window.confirm('Suspend this turf?')) return;
        try {
            const { data } = await api.post(`/admin/turf/venues/${id}/suspend`);
            setTurf(data.turf);
            setMessage('Turf suspended');
        } catch (err) {
            setError(err.response?.data?.message || 'Suspend failed');
        }
    };

    if (!turf || !editForm) {
        return error ? <div className="page"><Alert type="error">{error}</Alert></div> : <LoaderScreen message="Loading turf..." />;
    }

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-header-text">
                    <Link to="/admin/turf" className="muted">← Back to turfs</Link>
                    <h1 className="page-title">{turf.name}</h1>
                    <p className="page-subtitle">
                        {turf.owner?.business_name || turf.owner?.user?.name || 'Platform'} · {turf.is_published ? 'Published' : turf.status}
                    </p>
                </div>
                <div className="row-actions">
                    {turf.status === 'pending_approval' && (
                        <>
                            <button type="button" className="btn btn-primary" onClick={approve}>Approve</button>
                            <button type="button" className="btn btn-danger" onClick={reject}>Reject</button>
                        </>
                    )}
                    {turf.status !== 'suspended' && (
                        <button type="button" className="btn btn-secondary" onClick={suspend}>Suspend</button>
                    )}
                </div>
            </div>

            {error && <Alert type="error">{error}</Alert>}
            {message && <Alert type="success">{message}</Alert>}

            {turf.status === 'pending_approval' && (
                <div className="ui-card ui-card-accent" style={{ marginBottom: 16 }}>
                    <div className="ui-card-body">
                        <p style={{ margin: 0 }}>
                            This venue is awaiting approval. Approve to publish it for players, or reject to return it to draft.
                        </p>
                    </div>
                </div>
            )}

            <div className="ui-grid-2">
                <form className="ui-card" onSubmit={saveTurf}>
                    <div className="ui-card-header"><h2>Edit venue</h2></div>
                    <div className="ui-card-body form-grid">
                        <label className="form-field form-field-full"><span>Name</span><input className="form-control" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></label>
                        <label className="form-field form-field-full"><span>Description</span><textarea className="form-control" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></label>
                        <label className="form-field form-field-full"><span>Address</span><input className="form-control" required value={editForm.address_line1} onChange={(e) => setEditForm({ ...editForm, address_line1: e.target.value })} /></label>
                        <label className="form-field"><span>City</span><input className="form-control" required value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} /></label>
                        <label className="form-field"><span>State</span><input className="form-control" required value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} /></label>
                        <label className="form-field"><span>Pincode</span><input className="form-control" value={editForm.pincode} onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })} /></label>
                        <label className="form-field"><span>Slot minutes</span><input className="form-control" type="number" value={editForm.slot_duration_minutes} onChange={(e) => setEditForm({ ...editForm, slot_duration_minutes: e.target.value })} /></label>
                    </div>
                    <div className="ui-card-footer">
                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
                    </div>
                </form>

                <div className="stack-list">
                    <div className="ui-card">
                        <div className="ui-card-header"><h2>Courts ({turf.courts?.length || 0})</h2></div>
                        <div className="ui-card-body stack-list">
                            {(turf.courts || []).map((c) => (
                                <div key={c.id} className="list-card">
                                    <div>
                                        <h3>{c.name}</h3>
                                        <p className="muted">₹{c.base_price} · {c.is_active ? 'Active' : 'Inactive'}</p>
                                    </div>
                                </div>
                            ))}
                            {!turf.courts?.length && <p className="empty-state">No courts yet.</p>}
                        </div>
                    </div>

                    <form className="ui-card" onSubmit={addCourt}>
                        <div className="ui-card-header"><h2>Add court</h2></div>
                        <div className="ui-card-body form-grid">
                            <label className="form-field"><span>Name</span><input className="form-control" required value={courtForm.name} onChange={(e) => setCourtForm({ ...courtForm, name: e.target.value })} /></label>
                            <label className="form-field"><span>Base price</span><input className="form-control" type="number" required value={courtForm.base_price} onChange={(e) => setCourtForm({ ...courtForm, base_price: e.target.value })} /></label>
                            <label className="form-field form-field-full">
                                <span>Sport</span>
                                <select className="form-control" value={courtForm.sports_category_id} onChange={(e) => setCourtForm({ ...courtForm, sports_category_id: e.target.value })}>
                                    <option value="">Any</option>
                                    {(Array.isArray(sports) ? sports : []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </label>
                        </div>
                        <div className="ui-card-footer">
                            <button type="submit" className="btn btn-primary">Add court</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
