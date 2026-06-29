import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './AppRouter';

const root = document.getElementById('app');
if (root) {
    createRoot(root).render(
        <React.StrictMode>
            <BrowserRouter basename="/app">
                <AuthProvider>
                    <AppRouter />
                </AuthProvider>
            </BrowserRouter>
        </React.StrictMode>
    );
}
