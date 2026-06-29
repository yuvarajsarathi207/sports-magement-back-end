export const STATUS_LABELS = {
    draft: 'Draft',
    pending_approval: 'Pending',
    published: 'Published',
    rejected: 'Rejected',
};

export function statusBadgeVariant(status) {
    switch (status) {
        case 'published':
            return 'success';
        case 'pending_approval':
            return 'warning';
        case 'rejected':
            return 'danger';
        default:
            return 'info';
    }
}

export function tournamentBadge(tournament) {
    return {
        text: STATUS_LABELS[tournament.status] || tournament.status,
        variant: statusBadgeVariant(tournament.status),
    };
}
