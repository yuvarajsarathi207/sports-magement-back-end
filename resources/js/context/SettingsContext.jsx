import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/client';

const SettingsContext = createContext(null);

const DEFAULTS = {
    feature_mode: 'all',
    app_name: 'Keep Playing',
    logo_url: '/icons/logo-128.webp',
    logo_url_fallback: '/icons/logo-128.png',
    favicon_url: '/icons/logo-64.png',
    features: { shop: true, tournaments: true, module_switch: true },
};

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(DEFAULTS);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const { data } = await api.get('/settings');
            setSettings({
                ...DEFAULTS,
                ...data,
                logo_url: data.logo_url || DEFAULTS.logo_url,
                features: { ...DEFAULTS.features, ...(data.features || {}) },
            });
        } catch {
            setSettings(DEFAULTS);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return (
        <SettingsContext.Provider value={{ settings, loading, refresh, setSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
    return ctx;
}
