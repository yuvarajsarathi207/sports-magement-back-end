export function registerPwa() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js', { scope: '/' })
            .catch(() => {
                // SW registration failed (e.g. localhost without HTTPS in some browsers)
            });
    });
}
