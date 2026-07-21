import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/Alert';
import FormField from '../../components/FormField';

const ROLES = [
    {
        id: 'player',
        title: 'Player',
        desc: 'Shop gear and join tournaments',
        icon: '🎮',
    },
    {
        id: 'organizer',
        title: 'Organizer',
        desc: 'Create and manage tournaments',
        icon: '📋',
    },
];

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
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!acceptedTerms) {
            setError('Please accept the Terms & Conditions to continue.');
            return;
        }

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
        <div className="auth-page auth-page-split">
            <aside className="auth-aside">
                <Link to="/" className="auth-aside-brand">Keep Playing</Link>
                <h2>Create one account</h2>
                <p>Use the same login for shopping and tournaments. Register once.</p>
            </aside>

            <div className="auth-card auth-card-wide">
                <div className="auth-brand">
                    <span className="brand-mark">KP</span>
                    <h1>Create account</h1>
                    <p>Players can shop and book events with this account</p>
                </div>

                <Alert message={error} />

                <form onSubmit={handleSubmit} className="auth-form">
                    <FormField
                        label="Full name"
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        placeholder="John Doe"
                        required
                        autoComplete="name"
                    />

                    <div className="field-row">
                        <FormField
                            label="Email"
                            type="email"
                            value={form.email}
                            onChange={(e) => update('email', e.target.value)}
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                        />
                        <FormField
                            label="Mobile"
                            type="tel"
                            value={form.mobile}
                            onChange={(e) => update('mobile', e.target.value)}
                            placeholder="9876543210"
                            required
                            autoComplete="tel"
                        />
                    </div>

                    <FormField
                        label="Password"
                        type="password"
                        value={form.password}
                        onChange={(e) => update('password', e.target.value)}
                        placeholder="At least 8 characters"
                        required
                        autoComplete="new-password"
                        hint="Use 8+ characters with a mix of letters and numbers"
                    />

                    <div className="role-picker">
                        <span className="field-label">I want to join as</span>
                        <div className="role-cards">
                            {ROLES.map((role) => (
                                <button
                                    key={role.id}
                                    type="button"
                                    className={`role-card${form.role === role.id ? ' active' : ''}`}
                                    onClick={() => update('role', role.id)}
                                >
                                    <span className="role-card-icon">{role.icon}</span>
                                    <span className="role-card-title">{role.title}</span>
                                    <span className="role-card-desc">{role.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <label className="terms-check">
                        <input
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                        />
                        <span>
                            I agree to the{' '}
                            <Link to="/terms" target="_blank" rel="noopener noreferrer">Terms & Conditions</Link>
                            {' '}and{' '}
                            <Link to="/terms#privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>
                        </span>
                    </label>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block btn-lg"
                        disabled={loading || !acceptedTerms}
                    >
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
