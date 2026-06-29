import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import LoaderScreen from '../../components/LoaderScreen';
import Alert from '../../components/Alert';

export default function PlayerProfile() {
    const { user } = useAuth();
    const [form, setForm] = useState({ name: '', mobile: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/player/profile')
            .then((res) => {
                setForm({ name: res.data.name, mobile: res.data.mobile });
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        setError('');
        try {
            await api.put('/player/profile', form);
            setMessage('Profile updated successfully.');
        } catch (err) {
            const errors = err.response?.data?.errors;
            setError(errors ? Object.values(errors).flat().join(' ') : 'Update failed.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoaderScreen message="Loading profile..." />;

    return (
        <div className="page">
            <div className="profile-header">
                <div className="avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
                <div>
                    <h2>{user?.name}</h2>
                    <p className="text-muted">{user?.email}</p>
                    <span className="badge badge-info">Player</span>
                </div>
            </div>

            <Alert message={error} />
            {message && <Alert type="success" message={message} />}

            <form onSubmit={handleSubmit} className="profile-form">
                <label className="field">
                    <span>Full Name</span>
                    <input
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        required
                    />
                </label>

                <label className="field">
                    <span>Mobile</span>
                    <input
                        type="tel"
                        value={form.mobile}
                        onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))}
                        required
                    />
                </label>

                <label className="field">
                    <span>Email</span>
                    <input value={user?.email} disabled className="input-disabled" />
                </label>

                <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
}
