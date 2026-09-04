export const STATUS_LABELS = {
    draft: 'Draft',
    pending_approval: 'Pending Approval',
    pending_payment: 'Pending Payment',
    published: 'Published',
    rejected: 'Rejected',
};

export const PUBLISH_PATH_LABELS = {
    approval: 'Approval',
    payment: 'Payment',
};

export function statusBadgeVariant(status) {
    switch (status) {
        case 'published':
            return 'success';
        case 'pending_approval':
        case 'pending_payment':
            return 'warning';
        case 'rejected':
            return 'danger';
        default:
            return 'info';
    }
}

export function publishPathBadgeVariant(path) {
    if (path === 'payment') return 'warning';
    if (path === 'approval') return 'info';
    return 'neutral';
}

export function resolvePublishPath(tournament) {
    if (tournament?.publish_path) return tournament.publish_path;
    if (tournament?.status === 'pending_approval') return 'approval';
    if (tournament?.status === 'pending_payment') return 'payment';
    if (tournament?.approved_by) return 'approval';
    return null;
}

export function tournamentBadge(tournament) {
    return {
        text: STATUS_LABELS[tournament.status] || tournament.status,
        variant: statusBadgeVariant(tournament.status),
    };
}

export function publishPathBadge(tournament) {
    const path = resolvePublishPath(tournament);
    if (!path) return null;
    return {
        text: PUBLISH_PATH_LABELS[path] || path,
        variant: publishPathBadgeVariant(path),
    };
}
