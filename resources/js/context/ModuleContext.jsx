import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/client';

const ModuleContext = createContext(null);

const MODULE_HOME = {
    tournament: {
        player: '/',
        organizer: '/organizer',
        admin: '/admin',
        turf_owner: '/turf',
    },
    shop: {
        player: '/shop',
        organizer: '/organizer/shop',
        admin: '/admin/commerce',
        turf_owner: '/turf/shop',
    },
    turf: {
        player: '/turf',
        organizer: '/organizer/turf',
        admin: '/admin/turf',
        turf_owner: '/turf/owner',
    },
};

export function ModuleProvider({ children }) {
    const { user } = useAuth();
    const [modules, setModules] = useState([]);
    const [currentModule, setCurrentModuleState] = useState(() => localStorage.getItem('current_module') || 'tournament');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) {
            setModules([]);
            return;
        }

        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/modules/available');
                if (!cancelled) {
                    const list = data.modules || [];
                    setModules(list);
                    if (list.length && !list.some((m) => m.code === currentModule)) {
                        const next = list[0].code;
                        localStorage.setItem('current_module', next);
                        setCurrentModuleState(next);
                    }
                }
            } catch {
                if (!cancelled) {
                    // Fallback modules by legacy role
                    const fallback = [
                        { code: 'tournament', name: 'Tournaments', icon: 'trophy', route_prefix: '/' },
                        { code: 'shop', name: 'Shop', icon: 'cart', route_prefix: '/shop' },
                        { code: 'turf', name: 'Turf Booking', icon: 'stadium', route_prefix: '/turf' },
                    ];
                    setModules(fallback);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [user]);

    const setCurrentModule = (code) => {
        localStorage.setItem('current_module', code);
        setCurrentModuleState(code);
    };

    const homeForModule = (code, role = user?.role) => {
        return MODULE_HOME[code]?.[role] || MODULE_HOME[code]?.player || '/';
    };

    const value = useMemo(() => ({
        modules,
        currentModule,
        setCurrentModule,
        loading,
        homeForModule,
    }), [modules, currentModule, loading, user?.role]);

    return <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>;
}

export function useModules() {
    const ctx = useContext(ModuleContext);
    if (!ctx) throw new Error('useModules must be used within ModuleProvider');
    return ctx;
}
