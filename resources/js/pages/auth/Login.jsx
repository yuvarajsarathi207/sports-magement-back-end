import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePlatformSettings } from '../../context/SettingsContext';
import Alert from '../../components/Alert';

export default function Login() {
    const { login } = useAuth();
    const { settings } = usePlatformSettings();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const brandName = settings?.platform_name || 'Keep Playing';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(email, password);
            const home = user.role === 'organizer'
                ? '/organizer'
                : user.role === 'admin'
                    ? '/admin'
                    : user.role === 'turf_owner'
                        ? '/turf/owner'
                        : '/';
            navigate(home);
        } catch (err) {
            const msg = err.response?.data?.message
                || err.response?.data?.errors?.email?.[0]
                || 'Login failed. Check your credentials.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-shell">
            <div className="auth-hero">
                <div className="auth-hero-inner">
                    <p className="auth-kicker">Sports platform</p>
                    <h1>{brandName}</h1>
                    <p className="auth-hero-copy">
                        One account for tournaments, shop, and turf booking.
                    </p>
                    <ul className="auth-feature-list">
                        <li>Discover & join tournaments</li>
                        <li>Book turf slots instantly</li>
                        <li>Shop gear in one place</li>
                    </ul>
                </div>
            </div>

            <div className="auth-panel">
                <div className="auth-panel-card">
                    <div className="auth-panel-header">
                        <h2>Welcome back</h2>
                        <p>Sign in to continue to your dashboard</p>
                    </div>

                    <Alert message={error} />

                    <form onSubmit={handleSubmit} className="auth-form-modern">
                        <label className="form-field">
                            <span>Email</span>
                            <input
                                className="form-control"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                autoComplete="email"
                            />
                        </label>

                        <label className="form-field">
                            <span>Password</span>
                            <div className="password-field">
                                <input
                                    className="form-control"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </label>

                        <button type="submit" className="btn btn-primary btn-block auth-submit" disabled={loading}>
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>

                    <p className="auth-footer">
                        New here? <Link to="/register">Create an account</Link>
                    </p>

                    <div className="auth-legal">
                        <Link to="/terms">Terms</Link>
                        <span>·</span>
                        <Link to="/privacy">Privacy</Link>
                        <span>·</span>
                        <Link to="/refund-policy">Refunds</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
