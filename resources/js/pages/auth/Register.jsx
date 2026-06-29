import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/Alert';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        email: '',
        mobile: '',
        password: '',
        role: 'player',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await register(form);
            navigate(user.role === 'organizer' ? '/organizer' : '/');
        } catch (err) {
            const errors = err.response?.data?.errors;
            const msg = errors
                ? Object.values(errors).flat().join(' ')
                : err.response?.data?.message || 'Registration failed.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-brand">
                    <span className="brand-icon">🏆</span>
                    <h1>Join Keep Playing</h1>
                    <p>Register as a player or organizer</p>
                </div>

                <Alert message={error} />

                <form onSubmit={handleSubmit} className="auth-form">
                    <label className="field">
                        <span>Full Name</span>
                        <input
                            value={form.name}
                            onChange={(e) => update('name', e.target.value)}
                            placeholder="John Doe"
                            required
                        />
                    </label>

                    <label className="field">
                        <span>Email</span>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => update('email', e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </label>

                    <label className="field">
                        <span>Mobile</span>
                        <input
                            type="tel"
                            value={form.mobile}
                            onChange={(e) => update('mobile', e.target.value)}
                            placeholder="9876543210"
                            required
                        />
                    </label>

                    <label className="field">
                        <span>Password</span>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => update('password', e.target.value)}
                            placeholder="Min 8 characters"
                            minLength={8}
                            required
                        />
                    </label>

                    <div className="role-picker">
                        <span className="field-label">I am a</span>
                        <div className="role-options">
                            {['player', 'organizer'].map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    className={`role-btn${form.role === role ? ' active' : ''}`}
                                    onClick={() => update('role', role)}
                                >
                                    {role === 'player' ? '🎮 Player' : '📋 Organizer'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
