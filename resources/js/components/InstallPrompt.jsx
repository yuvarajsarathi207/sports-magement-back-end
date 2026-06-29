import { useEffect, useState } from 'react';

export default function InstallPrompt() {
    const [prompt, setPrompt] = useState(null);
    const [dismissed, setDismissed] = useState(
        () => localStorage.getItem('pwa_install_dismissed') === '1'
    );

    useEffect(() => {
        const onBeforeInstall = (e) => {
            e.preventDefault();
            setPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', onBeforeInstall);
        return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    }, []);

    const install = async () => {
        if (!prompt) return;
        prompt.prompt();
        await prompt.userChoice;
        setPrompt(null);
    };

    const dismiss = () => {
        localStorage.setItem('pwa_install_dismissed', '1');
        setDismissed(true);
        setPrompt(null);
    };

    if (!prompt || dismissed) return null;

    return (
        <div className="install-prompt" role="dialog" aria-label="Install app">
            <div className="install-prompt-body">
                <span className="install-prompt-icon">📲</span>
                <div>
                    <p className="install-prompt-title">Install Tournament Hub</p>
                    <p className="install-prompt-text">Add to your home screen for quick access</p>
                </div>
            </div>
            <div className="install-prompt-actions">
                <button type="button" className="btn btn-sm btn-outline" onClick={dismiss}>
                    Not now
                </button>
                <button type="button" className="btn btn-sm btn-primary" onClick={install}>
                    Install
                </button>
            </div>
        </div>
    );
}
