import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import LoaderScreen from '../../components/LoaderScreen';
import Alert from '../../components/Alert';

export default function PlayerProfile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const isPlayer = user?.role === 'player';
    const [form, setForm] = useState({ name: user?.name || '', mobile: user?.mobile || '' });
    const [loading, setLoading] = useState(isPlayer);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        if (!isPlayer) {
            setForm({ name: user?.name || '', mobile: user?.mobile || '' });
            setLoading(false);
            return;
        }

        api.get('/player/profile')
            .then((res) => {
                setForm({ name: res.data.name, mobile: res.data.mobile });
            })
            .catch(() => {
                setForm({ name: user?.name || '', mobile: user?.mobile || '' });
            })
            .finally(() => setLoading(false));
    }, [isPlayer, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isPlayer) return;

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

    const roleLabel = user?.role === 'admin' ? 'Admin' : user?.role === 'organizer' ? 'Organizer' : 'Player';
    const badgeTone = user?.role === 'admin' ? 'danger' : user?.role === 'organizer' ? 'warning' : 'info';

    return (
        <div className="page profile-page">
            <div className="profile-header profile-hero-card">
                <div className="avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
                <div>
                    <h2>{user?.name}</h2>
                    <p className="text-muted">{user?.email}</p>
                    {user?.mobile && <p className="text-muted">{user.mobile}</p>}
                    <span className={`badge badge-${badgeTone}`}>{roleLabel}</span>
                </div>
            </div>

            <Alert message={error} />
            {message && <Alert type="success" message={message} />}

            <section className="profile-section-card">
                <h3 className="profile-section-title">Account details</h3>
                {isPlayer ? (
                    <form onSubmit={handleSubmit} className="profile-form">
                        <label className="field">
                            <span>Full Name</span>
                            <input
                                value={form.name}
                                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                required
                                autoComplete="name"
                            />
                        </label>

                        <label className="field">
                            <span>Mobile</span>
                            <input
                                type="tel"
                                value={form.mobile}
                                onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))}
                                required
                                autoComplete="tel"
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
                ) : (
                    <div className="profile-form">
                        <label className="field">
                            <span>Full Name</span>
                            <input value={form.name} disabled className="input-disabled" />
                        </label>
                        <label className="field">
                            <span>Mobile</span>
                            <input value={form.mobile || '—'} disabled className="input-disabled" />
                        </label>
                        <label className="field">
                            <span>Email</span>
                            <input value={user?.email || ''} disabled className="input-disabled" />
                        </label>
                    </div>
                )}
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
                    <Link to="/refund-policy" className="profile-link-item">
                        <span className="profile-link-icon">↩</span>
                        <span className="profile-link-text">
                            <strong>No Refund Policy</strong>
                            <small>Refund rules for purchased services</small>
                        </span>
                        <span className="profile-link-arrow" aria-hidden>→</span>
                    </Link>
                </div>
            </section>

            <button
                type="button"
                className="btn btn-outline btn-block"
                onClick={() => setShowLogoutConfirm(true)}
            >
                Log out
            </button>

            {showLogoutConfirm && (
                <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
                    <div
                        className="modal-card"
                        role="dialog"
                        aria-labelledby="logout-title"
                        aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-icon">👋</div>
                        <h2 id="logout-title" className="modal-title">Log out?</h2>
                        <p className="modal-text">
                            Are you sure you want to log out of <strong>{user?.name}</strong>?
                        </p>
                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn btn-outline btn-block"
                                onClick={() => setShowLogoutConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger btn-block"
                                onClick={handleLogout}
                            >
                                Yes, Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
