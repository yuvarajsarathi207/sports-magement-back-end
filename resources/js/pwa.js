export function registerPwa() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', async () => {
        try {
            const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            // Force update so installed PWA picks up fixed service worker
            reg.update();
        } catch {
            // Registration failed
        }
    });
}
