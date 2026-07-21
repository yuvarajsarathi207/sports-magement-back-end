import { createContext, useContext, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ModuleContext = createContext(null);
const STORAGE_KEY = 'kp_active_module';

function detectModule(pathname) {
    if (
        pathname.startsWith('/tournaments')
        || pathname.startsWith('/player')
        || pathname.startsWith('/organizer')
        || pathname === '/admin'
        || pathname.startsWith('/admin/tournaments')
    ) {
        return 'tournaments';
    }
    return 'shop';
}

export function ModuleProvider({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const module = useMemo(() => detectModule(location.pathname), [location.pathname]);

    const switchModule = useCallback((next) => {
        const value = next === 'tournaments' ? 'tournaments' : 'shop';
        localStorage.setItem(STORAGE_KEY, value);

        if (value === 'shop') {
            if (user?.role === 'admin' || user?.role === 'super_admin') {
                navigate('/admin/shop');
            } else {
                navigate('/');
            }
            return;
        }

        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role === 'organizer') navigate('/organizer');
        else if (user.role === 'admin' || user.role === 'super_admin') navigate('/admin/tournaments');
        else if (user.role === 'player') navigate('/tournaments');
        else navigate('/login');
    }, [navigate, user]);

    return (
        <ModuleContext.Provider value={{ module, switchModule, isShop: module === 'shop' }}>
            {children}
        </ModuleContext.Provider>
    );
}

export function useModule() {
    const ctx = useContext(ModuleContext);
    if (!ctx) throw new Error('useModule must be used within ModuleProvider');
    return ctx;
}
