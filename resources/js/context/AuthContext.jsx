import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('auth_user');
        return stored ? JSON.parse(stored) : null;
    });
    const [loading, setLoading] = useState(true);

    const persistAuth = useCallback((userData, token) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        setUser(userData);
    }, []);

    const clearAuth = useCallback(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setUser(null);
    }, []);

    const refreshMe = useCallback(async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setLoading(false);
            return null;
        }
        try {
            const { data } = await api.get('/users/me');
            localStorage.setItem('auth_user', JSON.stringify(data));
            setUser(data);
            return data;
        } catch {
            clearAuth();
            return null;
        } finally {
            setLoading(false);
        }
    }, [clearAuth]);

    useEffect(() => {
        refreshMe();
    }, [refreshMe]);

    const login = async (email, password) => {
        const { data } = await api.post('/login', { email, password });
        persistAuth(data.user, data.token);
        const me = await refreshMe();
        return me || data.user;
    };

    const register = async (formData) => {
        const { data } = await api.post('/register', formData);
        persistAuth(data.user, data.token);
        const me = await refreshMe();
        return me || data.user;
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } catch {
            // token may already be invalid
        }
        clearAuth();
    };

    const hasPermission = (permission) => {
        if (!user) return false;
        if (user.role === 'admin' || user.permissions?.includes('*')) return true;
        return Array.isArray(user.permissions) && user.permissions.includes(permission);
    };

    const isPlayer = user?.role === 'player';
    const isOrganizer = user?.role === 'organizer';
    const isAdmin = user?.role === 'admin';
    const isTurfOwner = user?.role === 'turf_owner' || user?.roles?.includes('turf_owner');

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            register,
            logout,
            refreshMe,
            hasPermission,
            isPlayer,
            isOrganizer,
            isAdmin,
            isTurfOwner,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
