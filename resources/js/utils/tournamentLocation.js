export function composeTournamentLocation({ city, district, state, pincode }) {
    const area = [city, district, state].filter(Boolean).join(', ');
    if (!area) return '';
    return pincode ? `${area} - ${pincode}` : area;
}

export function formatTournamentArea(tournament) {
    const parts = [tournament.city, tournament.district, tournament.state].filter(Boolean);
    const area = parts.join(', ');
    if (tournament.pincode) {
        return area ? `${area} - ${tournament.pincode}` : tournament.pincode;
    }
    return area || tournament.location || 'Location TBA';
}
