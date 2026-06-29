const SPORT_ICONS = {
    Football: '⚽',
    Basketball: '🏀',
    Cricket: '🏏',
    Tennis: '🎾',
    Volleyball: '🏐',
    Badminton: '🏸',
    'Table Tennis': '🏓',
    Baseball: '⚾',
};

export function getSportIcon(name) {
    return SPORT_ICONS[name] || '🏅';
}
