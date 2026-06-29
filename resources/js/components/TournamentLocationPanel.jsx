export default function TournamentLocationPanel({ tournament, unlocked = false }) {
    const rows = [
        { icon: '🏙️', label: 'City', value: tournament.city },
        { icon: '📍', label: 'District', value: tournament.district },
        { icon: '🗺️', label: 'State', value: tournament.state },
        { icon: '📮', label: 'Pincode', value: tournament.pincode },
    ].filter((row) => row.value);

    const hasVenueDetails = Boolean(tournament.location_details?.trim());
    const hasVenueAddress = Boolean(tournament.location?.trim());

    if (!unlocked) {
        return (
            <section className="location-panel location-panel--locked-only">
                <div className="location-panel-header">
                    <span className="location-panel-icon">🔒</span>
                    <div>
                        <h3 className="location-panel-title">Location & Contact</h3>
                        <p className="location-panel-subtitle">Hidden until payment is complete</p>
                    </div>
                </div>
                <div className="location-panel-locked location-panel-locked--solo">
                    <div className="location-panel-locked-blur" aria-hidden="true">
                        <p>City, district & pincode</p>
                        <p>Venue address & directions</p>
                        <p>Contact & landmark details</p>
                    </div>
                    <div className="location-panel-locked-overlay">
                        <span className="location-panel-lock-icon">🔒</span>
                        <p className="location-panel-lock-title">Location locked</p>
                        <p className="location-panel-lock-text">
                            Subscribe and pay the entry fee to unlock full location and contact details.
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="location-panel location-panel--unlocked">
            <div className="location-panel-header">
                <span className="location-panel-icon">📍</span>
                <div>
                    <h3 className="location-panel-title">Location & Contact</h3>
                    <p className="location-panel-subtitle">Unlocked after payment</p>
                </div>
            </div>

            {rows.length > 0 && (
                <div className="location-panel-grid">
                    {rows.map((row) => (
                        <div key={row.label} className="location-panel-cell">
                            <span className="location-panel-cell-icon">{row.icon}</span>
                            <div>
                                <span className="location-panel-cell-label">{row.label}</span>
                                <span className="location-panel-cell-value">{row.value}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="location-panel-unlocked">
                {hasVenueAddress && (
                    <div className="location-panel-venue-row">
                        <span className="location-panel-venue-label">Venue</span>
                        <p className="location-panel-venue-text">{tournament.location}</p>
                    </div>
                )}
                {hasVenueDetails && (
                    <div className="location-panel-venue-row">
                        <span className="location-panel-venue-label">Directions & Contact</span>
                        <p className="location-panel-venue-text pre-wrap">{tournament.location_details}</p>
                    </div>
                )}
                {!hasVenueAddress && !hasVenueDetails && rows.length === 0 && (
                    <p className="text-muted">No additional location details provided.</p>
                )}
            </div>
        </section>
    );
}
