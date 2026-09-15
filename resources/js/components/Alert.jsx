export default function Alert({ type = 'error', message, children }) {
    const text = message || children;
    if (!text) return null;
    return <div className={`alert alert-${type}`}>{text}</div>;
}
