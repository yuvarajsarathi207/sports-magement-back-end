import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { featuresFromSettings, roleHome } from '../../utils/navigation';
import Alert from '../../components/Alert';
import FormField from '../../components/FormField';

export default function Login() {
    const { login } = useAuth();
    const { settings } = useSettings();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(email, password);
            navigate(roleHome(user.role, featuresFromSettings(settings)));
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
        <div className="auth-page auth-page-split">
            <aside className="auth-aside">
                <Link to="/" className="auth-aside-brand">Keep Playing</Link>
                <h2>Shop gear. Join tournaments.</h2>
                <p>One account for the store and the tournament hub.</p>
                <ul className="auth-aside-list">
                    <li>Browse products without signing in</li>
                    <li>Players can shop and book events</li>
                    <li>Organizers manage tournaments</li>
                </ul>
            </aside>

            <div className="auth-card auth-card-wide">
                <div className="auth-card-top">
                    <Link to="/" className="auth-back-link">← Back to shopping</Link>
                </div>

                <div className="auth-brand">
                    <img src="/icons/logo-128.webp" alt="Keep Playing" className="auth-brand-logo" width="72" height="72" decoding="async" onError={(e) => { e.currentTarget.src = '/icons/logo-128.png'; }} />
                    <h1>Welcome back</h1>
                    <p>Sign in to continue shopping or playing</p>
                </div>

                <Alert message={error} />

                <form onSubmit={handleSubmit} className="auth-form">
                    <FormField
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                    />
                    <FormField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your password"
                        required
                        autoComplete="current-password"
                    />
                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <p className="auth-footer">
                    <Link to="/forgot-password">Forgot password?</Link>
                    {' · '}
                    <Link to="/register">Create account</Link>
                </p>
            </div>
        </div>
    );
}
