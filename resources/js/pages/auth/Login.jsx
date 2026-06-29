import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/Alert';

export default function Login() {
    const { login } = useAuth();
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
            const home = user.role === 'organizer' ? '/organizer' : user.role === 'admin' ? '/admin' : '/';
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
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-brand">
                    <span className="brand-icon">🏆</span>
                    <h1>Keep Playing</h1>
                    <p>Sign in to manage tournaments & play</p>
                </div>

                <Alert message={error} />

                <form onSubmit={handleSubmit} className="auth-form">
                    <label className="field">
                        <span>Email</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                        />
                    </label>

                    <label className="field">
                        <span>Password</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
                    </label>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="auth-footer">
                    New here? <Link to="/register">Create account</Link>
                </p>
            </div>
        </div>
    );
}
