import { getSportIcon } from '../utils/sportIcons';

export default function CategoryFilter({
    categories,
    value,
    onChange,
    countKey = 'published_count',
    secondaryCountKey = null,
    label = 'Sport category',
}) {
    const countSuffix = countKey === 'published_count' ? 'live'
        : countKey === 'tournament_count' ? 'events'
            : countKey === 'pending_count' ? 'pending'
                : '';

    if (!categories?.length) return null;

    return (
        <div className="category-filter-wrap">
            <p className="category-filter-label">{label}</p>
            <div className="category-filter-scroll" role="tablist" aria-label={label}>
                <button
                    type="button"
                    role="tab"
                    aria-selected={!value}
                    className={`category-pill${!value ? ' active' : ''}`}
                    onClick={() => onChange('')}
                >
                    <span className="category-pill-icon">🏆</span>
                    <span className="category-pill-name">All</span>
                </button>

                {categories.map((cat) => {
                    const isActive = String(value) === String(cat.id);
                    const count = cat[countKey];
                    const secondary = secondaryCountKey ? cat[secondaryCountKey] : null;

                    return (
                        <button
                            key={cat.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            className={`category-pill${isActive ? ' active' : ''}`}
                            onClick={() => onChange(String(cat.id))}
                        >
                            <span className="category-pill-icon">{getSportIcon(cat.name)}</span>
                            <span className="category-pill-name">{cat.name}</span>
                            {(count !== undefined || secondary !== undefined) && (
                                <span className="category-pill-meta">
                                    {count !== undefined && countSuffix && (
                                        <span>{count} {countSuffix}</span>
                                    )}
                                    {secondary !== undefined && secondary > 0 && (
                                        <span className="category-pill-pending">{secondary} pending</span>
                                    )}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
