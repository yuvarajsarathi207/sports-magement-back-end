import { createContext, useContext, useCallback, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import {
    adminHome,
    featuresFromSettings,
    isAdminRole,
    isAdminShopPath,
    isSharedPath,
    isShopCustomerPath,
    isTournamentPath,
} from '../utils/navigation';

const ModuleContext = createContext(null);
const STORAGE_KEY = 'kp_active_module';

function detectModule(pathname) {
    return isTournamentPath(pathname) ? 'tournaments' : 'shop';
}

export function ModuleProvider({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { settings, loading } = useSettings();

    const features = featuresFromSettings(settings);
    const pathModule = useMemo(() => detectModule(location.pathname), [location.pathname]);

    const module = useMemo(() => {
        if (!features.shop && features.tournaments) return 'tournaments';
        if (features.shop && !features.tournaments) return 'shop';
        return pathModule;
    }, [features, pathModule]);

    useEffect(() => {
        if (loading) return;
        if (isSharedPath(location.pathname)) return;

        const path = location.pathname;

        // Tournaments only — leave shop/admin-shop (except settings)
        if (!features.shop && features.tournaments) {
            if (isAdminShopPath(path)) {
                navigate(adminHome(features), { replace: true });
                return;
            }
            if (isShopCustomerPath(path)) {
                if (user?.role === 'organizer') navigate('/organizer', { replace: true });
                else if (isAdminRole(user?.role)) navigate(adminHome(features), { replace: true });
                else if (user?.role === 'player') navigate('/tournaments', { replace: true });
                else navigate('/login', { replace: true });
            }
            return;
        }

        // Shop only — leave tournament module paths
        if (features.shop && !features.tournaments) {
            if (isTournamentPath(path)) {
                if (isAdminRole(user?.role)) navigate(adminHome(features), { replace: true });
                else navigate('/', { replace: true });
            }
        }
    }, [loading, features, location.pathname, navigate, user]);

    const switchModule = useCallback((next) => {
        if (!features.module_switch) return;

        const value = next === 'tournaments' ? 'tournaments' : 'shop';
        if (value === 'shop' && !features.shop) return;
        if (value === 'tournaments' && !features.tournaments) return;

        localStorage.setItem(STORAGE_KEY, value);

        if (value === 'shop') {
            navigate(isAdminRole(user?.role) ? adminHome(features) : '/');
            return;
        }

        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role === 'organizer') navigate('/organizer');
        else if (isAdminRole(user.role)) navigate('/admin/tournaments');
        else if (user.role === 'player') navigate('/tournaments');
        else navigate('/login');
    }, [navigate, user, features]);

    return (
        <ModuleContext.Provider value={{
            module,
            switchModule,
            isShop: module === 'shop',
            features,
            featureMode: settings.feature_mode,
            adminHome: adminHome(features),
        }}>
            {children}
        </ModuleContext.Provider>
    );
}

export function useModule() {
    const ctx = useContext(ModuleContext);
    if (!ctx) throw new Error('useModule must be used within ModuleProvider');
    return ctx;
}
