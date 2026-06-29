const TONE_CLASS = {
    neutral: 'status-stat--neutral',
    warning: 'status-stat--warning',
    success: 'status-stat--success',
    danger: 'status-stat--danger',
    info: 'status-stat--info',
};

export default function StatusStats({ items }) {
    if (!items?.length) return null;

    return (
        <div className="status-stats">
            {items.map((item) => (
                <div
                    key={item.label}
                    className={`status-stat ${TONE_CLASS[item.tone] || TONE_CLASS.neutral}`}
                >
                    <span className="status-stat-icon" aria-hidden="true">{item.icon}</span>
                    <div className="status-stat-body">
                        <span className="status-stat-value">{item.value}</span>
                        <span className="status-stat-label">{item.label}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
