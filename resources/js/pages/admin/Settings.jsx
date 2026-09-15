import { useEffect, useState } from 'react';
import api from '../../api/client';
import Alert from '../../components/Alert';
import LoaderScreen from '../../components/LoaderScreen';
import { usePlatformSettings } from '../../context/SettingsContext';

const THEME_FALLBACK = [
    { id: 'ocean', label: 'Ocean Blue', swatch: '#2563eb' },
    { id: 'forest', label: 'Forest Green', swatch: '#16a34a' },
    { id: 'sunset', label: 'Sunset Orange', swatch: '#ea580c' },
    { id: 'royal', label: 'Royal Purple', swatch: '#7c3aed' },
    { id: 'midnight', label: 'Midnight Dark', swatch: '#38bdf8' },
];

export default function AdminSettings() {
    const { applyAdminSettings } = usePlatformSettings();
    const [form, setForm] = useState({
        tournament_publish_mode: 'approval',
        organizer_publish_fee: '0',
        player_subscription_fee: '0',
        phonepe_env: 'sandbox',
        app_theme: 'ocean',
        payment_method: 'phonepe',
        platform_name: 'Keep Playing',
        support_email: '',
        support_phone: '',
        payment_instructions: '',
    });
    const [themes, setThemes] = useState(THEME_FALLBACK);
    const [phonepeMeta, setPhonepeMeta] = useState({
        sandbox_configured: false,
        production_configured: false,
        merchant_id: null,
        sandbox_client_id_hint: null,
        production_client_id_hint: null,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const applySettings = (payload) => {
        setForm({
            tournament_publish_mode: payload.tournament_publish_mode || 'approval',
            organizer_publish_fee: String(payload.organizer_publish_fee ?? 0),
            player_subscription_fee: String(payload.player_subscription_fee ?? 0),
            phonepe_env: payload.phonepe_env || payload.phonepe?.active_env || 'sandbox',
            app_theme: payload.app_theme || 'ocean',
            payment_method: payload.payment_method || 'phonepe',
            platform_name: payload.platform_name || 'Keep Playing',
            support_email: payload.support_email || '',
            support_phone: payload.support_phone || '',
            payment_instructions: payload.payment_instructions || '',
        });
        if (payload.available_themes?.length) {
            setThemes(payload.available_themes);
        }
        if (payload.phonepe) {
            setPhonepeMeta({
                sandbox_configured: !!payload.phonepe.sandbox_configured,
                production_configured: !!payload.phonepe.production_configured,
                merchant_id: payload.phonepe.merchant_id || null,
                sandbox_client_id_hint: payload.phonepe.sandbox_client_id_hint || null,
                production_client_id_hint: payload.phonepe.production_client_id_hint || null,
            });
        }
        applyAdminSettings(payload);
    };

    useEffect(() => {
        api.get('/admin/settings')
            .then((res) => applySettings(res.data))
            .catch((err) => setError(err.response?.data?.message || 'Failed to load preferences.'))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        setError('');
        try {
            const { data } = await api.put('/admin/settings', {
                tournament_publish_mode: form.tournament_publish_mode,
                organizer_publish_fee: Number(form.organizer_publish_fee),
                player_subscription_fee: Number(form.player_subscription_fee),
                phonepe_env: form.phonepe_env,
                app_theme: form.app_theme,
                payment_method: form.payment_method,
                platform_name: form.platform_name,
                support_email: form.support_email || null,
                support_phone: form.support_phone || null,
                payment_instructions: form.payment_instructions || null,
            });
            applySettings(data.settings);
            setMessage(data.message || 'Preferences saved.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save preferences.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoaderScreen message="Loading preferences..." />;

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-header-text">
                    <h1 className="page-title" style={{ marginBottom: 0 }}>Admin preferences</h1>
                    <p className="page-subtitle">
                        Theme, payments, fees, publish flow, and support contacts — all in one place.
                    </p>
                </div>
            </div>

            <Alert message={error} />
            {message && <Alert type="success" message={message} />}

            <form className="prefs-form" onSubmit={save}>
                <section className="prefs-card">
                    <h2 className="prefs-card-title">🎨 Theme</h2>
                    <p className="prefs-card-hint">Applies across player, organizer, and admin apps.</p>
                    <div className="theme-grid">
                        {themes.map((theme) => (
                            <button
                                key={theme.id}
                                type="button"
                                className={`theme-option${form.app_theme === theme.id ? ' active' : ''}`}
                                onClick={() => setForm((f) => ({ ...f, app_theme: theme.id }))}
                            >
                                <span className="theme-swatch" style={{ background: theme.swatch }} />
                                <span className="theme-option-label">{theme.label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="prefs-card">
                    <h2 className="prefs-card-title">🏷️ Platform</h2>
                    <label className="field">
                        <span>Platform name</span>
                        <input
                            type="text"
                            value={form.platform_name}
                            onChange={(e) => setForm((f) => ({ ...f, platform_name: e.target.value }))}
                            required
                            maxLength={80}
                        />
                    </label>
                    <div className="field-row">
                        <label className="field">
                            <span>Support email</span>
                            <input
                                type="email"
                                value={form.support_email}
                                onChange={(e) => setForm((f) => ({ ...f, support_email: e.target.value }))}
                                placeholder="support@example.com"
                            />
                        </label>
                        <label className="field">
                            <span>Support phone</span>
                            <input
                                type="text"
                                value={form.support_phone}
                                onChange={(e) => setForm((f) => ({ ...f, support_phone: e.target.value }))}
                                placeholder="9876543210"
                            />
                        </label>
                    </div>
                </section>

                <section className="prefs-card">
                    <h2 className="prefs-card-title">💳 Payment method</h2>
                    <p className="prefs-card-hint">How organizers and players settle fees on the platform.</p>
                    <fieldset className="field settings-mode-field">
                        <label className="radio-option">
                            <input
                                type="radio"
                                name="payment_method"
                                value="phonepe"
                                checked={form.payment_method === 'phonepe'}
                                onChange={() => setForm((f) => ({ ...f, payment_method: 'phonepe' }))}
                            />
                            <span>
                                <strong>PhonePe gateway</strong>
                                <br />
                                <small className="text-muted">Online checkout via PhonePe (sandbox or production)</small>
                            </span>
                        </label>
                        <label className="radio-option">
                            <input
                                type="radio"
                                name="payment_method"
                                value="manual"
                                checked={form.payment_method === 'manual'}
                                onChange={() => setForm((f) => ({ ...f, payment_method: 'manual' }))}
                            />
                            <span>
                                <strong>Manual / offline</strong>
                                <br />
                                <small className="text-muted">Show payment instructions; organizer marks players as paid</small>
                            </span>
                        </label>
                        <label className="radio-option">
                            <input
                                type="radio"
                                name="payment_method"
                                value="free"
                                checked={form.payment_method === 'free'}
                                onChange={() => setForm((f) => ({ ...f, payment_method: 'free' }))}
                            />
                            <span>
                                <strong>Free (auto-approve)</strong>
                                <br />
                                <small className="text-muted">Skip gateway — activate / publish without collecting payment</small>
                            </span>
                        </label>
                    </fieldset>

                    {(form.payment_method === 'manual' || form.payment_method === 'phonepe') && (
                        <label className="field">
                            <span>Payment instructions (shown for manual / offline)</span>
                            <textarea
                                rows={3}
                                value={form.payment_instructions}
                                onChange={(e) => setForm((f) => ({ ...f, payment_instructions: e.target.value }))}
                                placeholder="UPI ID, bank details, or what players should do after paying"
                            />
                        </label>
                    )}

                    {form.payment_method === 'phonepe' && (
                        <fieldset className="field settings-mode-field" style={{ marginTop: 8 }}>
                            <legend className="field-label">PhonePe environment</legend>
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="phonepe_env"
                                    value="sandbox"
                                    checked={form.phonepe_env === 'sandbox'}
                                    onChange={() => setForm((f) => ({ ...f, phonepe_env: 'sandbox' }))}
                                    disabled={!phonepeMeta.sandbox_configured}
                                />
                                <span>
                                    Sandbox (test)
                                    {phonepeMeta.sandbox_configured
                                        ? ` · ${phonepeMeta.sandbox_client_id_hint || 'configured'}`
                                        : ' · credentials missing in .env'}
                                </span>
                            </label>
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="phonepe_env"
                                    value="production"
                                    checked={form.phonepe_env === 'production'}
                                    onChange={() => setForm((f) => ({ ...f, phonepe_env: 'production' }))}
                                    disabled={!phonepeMeta.production_configured}
                                />
                                <span>
                                    Production (live)
                                    {phonepeMeta.production_configured
                                        ? ` · ${phonepeMeta.production_client_id_hint || 'configured'}`
                                        : ' · credentials missing in .env'}
                                </span>
                            </label>
                            {phonepeMeta.merchant_id && (
                                <p className="text-muted" style={{ marginTop: 8, fontSize: 13 }}>
                                    Merchant ID: {phonepeMeta.merchant_id}
                                </p>
                            )}
                        </fieldset>
                    )}
                </section>

                <section className="prefs-card">
                    <h2 className="prefs-card-title">💰 Fees</h2>
                    <div className="field-row">
                        <label className="field">
                            <span>Organizer publish fee (₹)</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.organizer_publish_fee}
                                onChange={(e) => setForm((f) => ({ ...f, organizer_publish_fee: e.target.value }))}
                                required
                            />
                        </label>
                        <label className="field">
                            <span>Player subscription fee (₹)</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.player_subscription_fee}
                                onChange={(e) => setForm((f) => ({ ...f, player_subscription_fee: e.target.value }))}
                                required
                            />
                        </label>
                    </div>
                    <p className="text-muted" style={{ fontSize: 13 }}>
                        Set either fee to 0 to skip charging for that action (even when PhonePe is selected).
                    </p>
                </section>

                <section className="prefs-card">
                    <h2 className="prefs-card-title">📤 Tournament publish mode</h2>
                    <fieldset className="field settings-mode-field">
                        <label className="radio-option">
                            <input
                                type="radio"
                                name="tournament_publish_mode"
                                value="approval"
                                checked={form.tournament_publish_mode === 'approval'}
                                onChange={() => setForm((f) => ({ ...f, tournament_publish_mode: 'approval' }))}
                            />
                            <span>Approval flow — organizer submits, admin approves</span>
                        </label>
                        <label className="radio-option">
                            <input
                                type="radio"
                                name="tournament_publish_mode"
                                value="payment"
                                checked={form.tournament_publish_mode === 'payment'}
                                onChange={() => setForm((f) => ({ ...f, tournament_publish_mode: 'payment' }))}
                            />
                            <span>Payment flow — organizer pays publish fee, then auto-publishes</span>
                        </label>
                    </fieldset>
                </section>

                <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
                    {saving ? 'Saving...' : 'Save preferences'}
                </button>
            </form>
        </div>
    );
}
