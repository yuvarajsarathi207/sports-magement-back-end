import { useEffect, useState } from 'react';
import api from '../../api/client';
import Alert from '../../components/Alert';
import LoaderScreen from '../../components/LoaderScreen';

export default function AdminSettings() {
    const [form, setForm] = useState({
        tournament_publish_mode: 'approval',
        organizer_publish_fee: '0',
        player_subscription_fee: '0',
        phonepe_env: 'sandbox',
    });
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
        });
        if (payload.phonepe) {
            setPhonepeMeta({
                sandbox_configured: !!payload.phonepe.sandbox_configured,
                production_configured: !!payload.phonepe.production_configured,
                merchant_id: payload.phonepe.merchant_id || null,
                sandbox_client_id_hint: payload.phonepe.sandbox_client_id_hint || null,
                production_client_id_hint: payload.phonepe.production_client_id_hint || null,
            });
        }
    };

    useEffect(() => {
        api.get('/admin/settings')
            .then((res) => applySettings(res.data))
            .catch((err) => setError(err.response?.data?.message || 'Failed to load settings.'))
            .finally(() => setLoading(false));
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
            });
            applySettings(data.settings);
            setMessage(data.message || 'Settings saved.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoaderScreen message="Loading settings..." />;

    return (
        <div className="page">
            <section className="section">
                <h2 className="section-title">Platform Settings</h2>
                <p className="text-muted">
                    Choose how tournaments go live, set fees, and switch PhonePe sandbox/production.
                </p>
            </section>

            <Alert message={error} />
            {message && <Alert type="success" message={message} />}

            <form className="detail-section" onSubmit={save}>
                <fieldset className="field settings-mode-field">
                    <legend className="field-label">Tournament publish mode</legend>
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

                <fieldset className="field settings-mode-field">
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
                        <p className="text-muted" style={{ marginTop: '8px', fontSize: '13px' }}>
                            Merchant ID: {phonepeMeta.merchant_id}
                        </p>
                    )}
                </fieldset>

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

                <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
                    {saving ? 'Saving...' : 'Save settings'}
                </button>
            </form>
        </div>
    );
}
