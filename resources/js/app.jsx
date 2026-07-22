import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
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
                    <SettingsProvider>
                        <ModuleProvider>
                            <InstallPrompt />
                            <AppRouter />
                        </ModuleProvider>
                    </SettingsProvider>
                </AuthProvider>
            </BrowserRouter>
        </React.StrictMode>
    );
}
