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

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setLoading(false);
            return;
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const { data } = await api.post('/login', { email, password });
        persistAuth(data.user, data.token);
        return data.user;
    };

    const register = async (formData) => {
        const { data } = await api.post('/register', formData);
        persistAuth(data.user, data.token);
        return data.user;
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } catch {
            // token may already be invalid
        }
        clearAuth();
    };

    const isPlayer = user?.role === 'player';
    const isOrganizer = user?.role === 'organizer';
    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, isPlayer, isOrganizer, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
