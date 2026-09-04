import { useEffect, useState } from 'react';
import api from '../../api/client';
import Alert from '../../components/Alert';
import LoaderScreen from '../../components/LoaderScreen';

export default function AdminSettings() {
    const [form, setForm] = useState({
        tournament_publish_mode: 'approval',
        organizer_publish_fee: '0',
        player_subscription_fee: '0',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/admin/settings')
            .then((res) => {
                setForm({
                    tournament_publish_mode: res.data.tournament_publish_mode || 'approval',
                    organizer_publish_fee: String(res.data.organizer_publish_fee ?? 0),
                    player_subscription_fee: String(res.data.player_subscription_fee ?? 0),
                });
            })
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
            });
            setForm({
                tournament_publish_mode: data.settings.tournament_publish_mode,
                organizer_publish_fee: String(data.settings.organizer_publish_fee),
                player_subscription_fee: String(data.settings.player_subscription_fee),
            });
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
                    Choose how tournaments go live, and set global fees charged through PhonePe.
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
