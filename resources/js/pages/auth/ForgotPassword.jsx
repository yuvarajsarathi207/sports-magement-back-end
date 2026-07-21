import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import Alert from '../../components/Alert';
import FormField from '../../components/FormField';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [token, setToken] = useState('');
    const [step, setStep] = useState(1);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const requestToken = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);
        try {
            const { data } = await api.post('/forgot-password', { email });
            setMessage(data.message);
            if (data.reset_token) {
                setToken(data.reset_token);
                setStep(2);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Request failed');
        } finally {
            setLoading(false);
        }
    };

    const reset = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);
        try {
            const { data } = await api.post('/reset-password', {
                email,
                token,
                password,
                password_confirmation: passwordConfirmation,
            });
            setMessage(data.message);
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.errors?.token?.[0] || 'Reset failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page auth-page-split">
            <aside className="auth-aside">
                <Link to="/" className="auth-aside-brand">Keep Playing</Link>
                <h2>Reset your password</h2>
                <p>We’ll help you get back into your shop & tournament account.</p>
            </aside>

            <div className="auth-card auth-card-wide">
                <div className="auth-brand">
                    <span className="brand-mark">KP</span>
                    <h1>
                        {step === 1 && 'Forgot password'}
                        {step === 2 && 'Choose a new password'}
                        {step === 3 && 'All set'}
                    </h1>
                    <p>
                        {step === 1 && 'Enter the email linked to your account'}
                        {step === 2 && 'Paste the reset token and set a new password'}
                        {step === 3 && 'Your password has been updated'}
                    </p>
                </div>

                {message && <p className="form-success auth-banner-ok">{message}</p>}
                <Alert message={error} />

                {step === 1 && (
                    <form onSubmit={requestToken} className="auth-form">
                        <FormField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                        />
                        <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
                            {loading ? 'Sending...' : 'Send reset link'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={reset} className="auth-form">
                        <FormField
                            label="Reset token"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="Paste token from email / API response"
                            required
                        />
                        <FormField
                            label="New password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            required
                            autoComplete="new-password"
                        />
                        <FormField
                            label="Confirm password"
                            type="password"
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            placeholder="Repeat password"
                            required
                            autoComplete="new-password"
                        />
                        <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
                            {loading ? 'Updating...' : 'Reset password'}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <Link to="/login" className="btn btn-primary btn-block btn-lg">Back to login</Link>
                )}

                <p className="auth-footer">
                    <Link to="/login">Back to sign in</Link>
                </p>
            </div>
        </div>
    );
}
