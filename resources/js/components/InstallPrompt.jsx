import { useEffect, useState } from 'react';

function isStandalone() {
    return (
        window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true
    );
}

function isIos() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isAndroid() {
    return /android/i.test(navigator.userAgent);
}

export default function InstallPrompt() {
    const [prompt, setPrompt] = useState(null);
    const [mode, setMode] = useState(null);
    const [dismissed, setDismissed] = useState(
        () => localStorage.getItem('pwa_install_dismissed') === '1'
    );

    useEffect(() => {
        if (dismissed || isStandalone()) return;

        const onBeforeInstall = (e) => {
            e.preventDefault();
            setPrompt(e);
            setMode('native');
        };

        window.addEventListener('beforeinstallprompt', onBeforeInstall);

        const timer = setTimeout(() => {
            setMode((current) => {
                if (current) return current;
                if (isIos()) return 'ios';
                if (isAndroid()) return 'android';
                return 'desktop';
            });
        }, 2500);

        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstall);
            clearTimeout(timer);
        };
    }, [dismissed]);

    const install = async () => {
        if (!prompt) return;
        prompt.prompt();
        await prompt.userChoice;
        setPrompt(null);
        setMode(null);
    };

    const dismiss = () => {
        localStorage.setItem('pwa_install_dismissed', '1');
        setDismissed(true);
        setPrompt(null);
        setMode(null);
    };

    if (!mode || dismissed || isStandalone()) return null;

    const copy = {
        native: {
            title: 'Install Keep Playing',
            text: 'Add to your home screen for quick access',
        },
        ios: {
            title: 'Add to Home Screen',
            text: 'Tap Share (↑) in Safari, then choose “Add to Home Screen”',
        },
        android: {
            title: 'Install Keep Playing',
            text: 'Tap browser menu (⋮) → “Install app” or “Add to Home screen”',
        },
        desktop: {
            title: 'Install Keep Playing',
            text: 'Use the install icon in your browser address bar, or browser menu',
        },
    }[mode];

    return (
        <div className="install-prompt" role="dialog" aria-label="Install app">
            <div className="install-prompt-body">
                <span className="install-prompt-icon">📲</span>
                <div>
                    <p className="install-prompt-title">{copy.title}</p>
                    <p className="install-prompt-text">{copy.text}</p>
                </div>
            </div>
            <div className="install-prompt-actions">
                <button type="button" className="btn btn-sm btn-outline" onClick={dismiss}>
                    Not now
                </button>
                {mode === 'native' && (
                    <button type="button" className="btn btn-sm btn-primary" onClick={install}>
                        Install
                    </button>
                )}
            </div>
        </div>
    );
}
