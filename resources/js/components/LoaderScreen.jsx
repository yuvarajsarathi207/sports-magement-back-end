export default function LoaderScreen({ message = 'Loading...', fullScreen = false }) {
    return (
        <div className={`loader-screen${fullScreen ? ' loader-screen--full' : ''}`} role="status" aria-live="polite">
            <div className="loader-brand">
                <span className="loader-logo">🏆</span>
                <div className="loader-spinner" aria-hidden="true" />
            </div>
            <p className="loader-message">{message}</p>
        </div>
    );
}
