import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const SettingsContext = createContext(null);

const DEFAULT_THEME = {
    primary: '#2563eb',
    primary_dark: '#1d4ed8',
    header_from: '#1e3a5f',
    header_to: '#2563eb',
    bg: '#f0f4f8',
    surface: '#ffffff',
    text: '#0f172a',
    sidebar: '#0f172a',
    mode: 'light',
};

function applyThemeTokens(theme) {
    const root = document.documentElement;
    const tokens = { ...DEFAULT_THEME, ...(theme || {}) };

    root.style.setProperty('--primary', tokens.primary);
    root.style.setProperty('--primary-dark', tokens.primary_dark);
    root.style.setProperty('--header-from', tokens.header_from);
    root.style.setProperty('--header-to', tokens.header_to);
    root.style.setProperty('--bg', tokens.bg);
    root.style.setProperty('--surface', tokens.surface);
    root.style.setProperty('--text', tokens.text);
    root.style.setProperty('--sidebar-bg', tokens.sidebar);

    root.dataset.theme = tokens.mode || 'light';
    root.dataset.appTheme = tokens.mode === 'dark' ? 'midnight' : 'light';

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', tokens.header_from);
}

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshSettings = useCallback(async () => {
        try {
            const { data } = await api.get('/settings/public');
            setSettings(data);
            applyThemeTokens(data.theme);
            return data;
        } catch {
            applyThemeTokens(DEFAULT_THEME);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshSettings();
    }, [refreshSettings]);

    const value = useMemo(() => ({
        settings,
        loading,
        refreshSettings,
        applyAdminSettings: (payload) => {
            setSettings(payload);
            applyThemeTokens(payload?.theme);
        },
    }), [settings, loading, refreshSettings]);

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
}

export function usePlatformSettings() {
    const ctx = useContext(SettingsContext);
    if (!ctx) {
        throw new Error('usePlatformSettings must be used within SettingsProvider');
    }
    return ctx;
}
