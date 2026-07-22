import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import LoaderScreen from '../../components/LoaderScreen';
import Alert from '../../components/Alert';

export default function PlayerProfile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', mobile: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

    const handleLogout = async () => {
        await logout();
        setShowLogoutConfirm(false);
        navigate('/login');
    };

    if (loading) return <LoaderScreen message="Loading profile..." />;

    return (
        <div className="page profile-page">
            <div className="profile-header profile-hero-card">
                <div className="avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
                <div>
                    <h2>{user?.name}</h2>
                    <p className="text-muted">{user?.email}</p>
                    <span className="badge badge-info">Player</span>
                </div>
            </div>

            <Alert message={error} />
            {message && <Alert type="success" message={message} />}

            <section className="profile-section-card">
                <h3 className="profile-section-title">Account details</h3>
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
                        <input value={user?.email || ''} disabled className="input-disabled" />
                    </label>
                    <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </section>

            <section className="profile-section-card">
                <h3 className="profile-section-title">Legal</h3>
                <div className="profile-link-list">
                    <Link to="/terms" className="profile-link-item">
                        <span className="profile-link-icon">📄</span>
                        <span className="profile-link-text">
                            <strong>Terms & Conditions</strong>
                            <small>Rules for using Keep Playing</small>
                        </span>
                        <span className="profile-link-arrow" aria-hidden>→</span>
                    </Link>
                    <Link to="/privacy" className="profile-link-item">
                        <span className="profile-link-icon">🔒</span>
                        <span className="profile-link-text">
                            <strong>Privacy Policy</strong>
                            <small>How we collect and use your data</small>
                        </span>
                        <span className="profile-link-arrow" aria-hidden>→</span>
                    </Link>
                </div>
            </section>

            <button type="button" className="btn btn-outline btn-block" onClick={() => setShowLogoutConfirm(true)}>
                Log out
            </button>

            {showLogoutConfirm && (
                <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
                    <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon">👋</div>
                        <h2 className="modal-title">Log out?</h2>
                        <p className="modal-text">Are you sure you want to log out of <strong>{user?.name}</strong>?</p>
                        <div className="modal-actions">
                            <button type="button" className="btn btn-outline btn-block" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
                            <button type="button" className="btn btn-danger btn-block" onClick={handleLogout}>Yes, Log Out</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
