import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ModuleProvider } from './context/ModuleContext';
import AppRouter from './AppRouter';
import InstallPrompt from './components/InstallPrompt';
import { registerPwa } from './pwa';

registerPwa();

const root = document.getElementById('app');
if (root) {
    createRoot(root).render(
        <React.StrictMode>
            <BrowserRouter basename="/app">
                <AuthProvider>
                    <ModuleProvider>
                        <InstallPrompt />
                        <AppRouter />
                    </ModuleProvider>
                </AuthProvider>
            </BrowserRouter>
        </React.StrictMode>
    );
}
