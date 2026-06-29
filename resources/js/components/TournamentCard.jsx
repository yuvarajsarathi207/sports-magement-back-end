import { getSportIcon } from '../utils/sportIcons';

export default function TournamentCard({ tournament, onClick, badge, hideLocation = false }) {
    const category = tournament.sports_category?.name || tournament.sportsCategory?.name || 'Sport';
    const startDate = tournament.start_date
        ? new Date(tournament.start_date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
        : '—';
    const endDate = tournament.winning_date
        ? new Date(tournament.winning_date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
        })
        : null;

    const area = [tournament.city, tournament.district, tournament.state]
        .filter(Boolean)
        .join(', ');
    const locationLabel = area
        ? `${area}${tournament.pincode ? ` · ${tournament.pincode}` : ''}`
        : (tournament.location || 'Location TBA');

    const fee = Number(tournament.entry_fee || 0).toLocaleString('en-IN');
    const slots = tournament.slot_count;

    return (
        <article
            className="tournament-card"
            onClick={onClick}
            onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick(e) : undefined}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            <div className="tournament-card-accent" aria-hidden="true" />

            <div className="tournament-card-body">
                <div className="tournament-card-header">
                    <div className="tournament-card-sport">
                        <span className="tournament-card-icon">{getSportIcon(category)}</span>
                        <span className="tournament-card-category">{category}</span>
                    </div>
                    {badge && (
                        <span className={`tournament-card-badge badge-${badge.variant}`}>
                            {badge.text}
                        </span>
                    )}
                </div>

                <h3 className="tournament-card-title">{tournament.team_name}</h3>

                <div className="tournament-card-info">
                    {!hideLocation ? (
                        <p className="tournament-card-row">
                            <span className="tournament-card-row-icon">📍</span>
                            <span className="tournament-card-row-text">{locationLabel}</span>
                        </p>
                    ) : (
                        <p className="tournament-card-row tournament-card-row--locked">
                            <span className="tournament-card-row-icon">🔒</span>
                            <span className="tournament-card-row-text">Location unlocks after payment</span>
                        </p>
                    )}
                    <div className="tournament-card-meta-row">
                        <span className="tournament-card-row">
                            <span className="tournament-card-row-icon">📅</span>
                            <span className="tournament-card-row-text">
                                {startDate}
                                {endDate ? ` → ${endDate}` : ''}
                            </span>
                        </span>
                        {slots ? (
                            <span className="tournament-card-slots">👥 {slots} slots</span>
                        ) : null}
                    </div>
                </div>

                <div className="tournament-card-footer">
                    <div className="tournament-card-fee-block">
                        <span className="tournament-card-fee-label">Entry fee</span>
                        <span className="tournament-card-fee">₹{fee}</span>
                    </div>
                    {onClick && <span className="tournament-card-chevron" aria-hidden="true">›</span>}
                </div>
            </div>
        </article>
    );
}
