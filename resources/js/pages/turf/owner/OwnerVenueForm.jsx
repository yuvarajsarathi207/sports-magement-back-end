import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../api/client';

export default function OwnerVenueForm() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        description: '',
        address_line1: '',
        city: '',
        state: '',
        pincode: '',
        slot_duration_minutes: 60,
        business_name: '',
    });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const { data } = await api.post('/turf/owner/venues', form);
            navigate(`/turf/owner/venues/${data.id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create venue');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-header-text">
                    <Link to="/turf/owner/venues" className="muted">← My venues</Link>
                    <h1 className="page-title">Add Venue</h1>
                    <p className="page-subtitle">Create a turf location players can book.</p>
                </div>
            </div>
            {error && <p className="error-text">{error}</p>}
            <form className="ui-card" style={{ maxWidth: 640 }} onSubmit={submit}>
                <div className="ui-card-body form-grid">
                    <label className="form-field form-field-full">
                        <span>Business name</span>
                        <input className="form-control" value={form.business_name} onChange={set('business_name')} placeholder="Optional" />
                    </label>
                    <label className="form-field form-field-full">
                        <span>Venue name</span>
                        <input className="form-control" required value={form.name} onChange={set('name')} />
                    </label>
                    <label className="form-field form-field-full">
                        <span>Description</span>
                        <textarea className="form-control" value={form.description} onChange={set('description')} />
                    </label>
                    <label className="form-field form-field-full">
                        <span>Address</span>
                        <input className="form-control" required value={form.address_line1} onChange={set('address_line1')} />
                    </label>
                    <label className="form-field">
                        <span>City</span>
                        <input className="form-control" required value={form.city} onChange={set('city')} />
                    </label>
                    <label className="form-field">
                        <span>State</span>
                        <input className="form-control" required value={form.state} onChange={set('state')} />
                    </label>
                    <label className="form-field">
                        <span>Pincode</span>
                        <input className="form-control" value={form.pincode} onChange={set('pincode')} />
                    </label>
                    <label className="form-field">
                        <span>Slot duration (minutes)</span>
                        <input className="form-control" type="number" min={15} max={240} value={form.slot_duration_minutes} onChange={set('slot_duration_minutes')} />
                    </label>
                </div>
                <div className="ui-card-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/turf/owner/venues')}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving…' : 'Create venue'}
                    </button>
                </div>
            </form>
            <p className="muted" style={{ marginTop: 12, maxWidth: 640 }}>
                After adding courts, use Publish. If approval is required, the venue stays pending until an admin approves it.
            </p>
        </div>
    );
}
