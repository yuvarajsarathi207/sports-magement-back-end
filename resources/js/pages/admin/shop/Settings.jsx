import { useEffect, useState } from 'react';
import api from '../../../api/client';
import { useSettings } from '../../../context/SettingsContext';
import LoaderScreen from '../../../components/LoaderScreen';
import Alert from '../../../components/Alert';

const MODES = [
    {
        id: 'all',
        title: 'All features',
        desc: 'Shop and Tournaments both enabled. Users can switch between them.',
        icon: '✨',
    },
    {
        id: 'shop',
        title: 'Shop only',
        desc: 'Show only the e-commerce store. Tournament module is hidden.',
        icon: '🛍️',
    },
    {
        id: 'tournaments',
        title: 'Tournaments only',
        desc: 'Show only the tournament module. Store is hidden.',
        icon: '🏆',
    },
];

export default function AdminSettings() {
    const { settings, refresh, setSettings } = useSettings();
    const [mode, setMode] = useState(settings.feature_mode || 'all');
    const [appName, setAppName] = useState(settings.app_name || 'Keep Playing');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/settings')
            .then((res) => {
                setMode(res.data.feature_mode || 'all');
                setAppName(res.data.app_name || 'Keep Playing');
                setSettings((prev) => ({ ...prev, ...res.data }));
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [setSettings]);

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        setError('');
        try {
            const { data } = await api.put('/admin/settings', {
                feature_mode: mode,
                app_name: appName,
            });
            setSettings((prev) => ({ ...prev, ...data.settings }));
            await refresh();
            setMessage('Settings saved. Feature visibility updated for all users.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoaderScreen message="Loading settings..." />;

    return (
        <div className="page admin-form-page">
            <h2 className="section-title">App settings</h2>
            <p className="text-muted" style={{ marginBottom: 16 }}>
                Control which modules are visible across the app. Logo and favicon use the Keep Playing brand image.
            </p>

            <Alert message={error} />
            {message && <Alert type="success" message={message} />}

            <form className="ui-panel ui-form" onSubmit={save}>
                <div className="settings-brand-preview">
                    <img src="/icons/logo-128.png" alt="Keep Playing logo" className="settings-logo-preview" width="72" height="72" decoding="async" />
                    <div>
                        <strong>Brand logo</strong>
                        <p className="text-muted">Optimized header/favicon assets (`/icons/logo-128.webp`, `/icons/logo-64.png`).</p>
                    </div>
                </div>

                <label className="field ui-field">
                    <span className="field-label-row">App name</span>
                    <div className="ui-input-wrap">
                        <input
                            value={appName}
                            onChange={(e) => setAppName(e.target.value)}
                            required
                        />
                    </div>
                </label>

                <div className="field">
                    <span className="field-label">Feature mode</span>
                    <div className="settings-mode-grid">
                        {MODES.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={`settings-mode-card${mode === item.id ? ' active' : ''}`}
                                onClick={() => setMode(item.id)}
                            >
                                <span className="settings-mode-icon">{item.icon}</span>
                                <strong>{item.title}</strong>
                                <small>{item.desc}</small>
                            </button>
                        ))}
                    </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save settings'}
                </button>
            </form>
        </div>
    );
}
