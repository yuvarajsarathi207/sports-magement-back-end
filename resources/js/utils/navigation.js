/** Shared routing helpers for feature modes (shop / tournaments / all). */

export function isAdminRole(role) {
    return role === 'admin' || role === 'super_admin';
}

export function featuresFromSettings(settings) {
    return settings?.features || { shop: true, tournaments: true, module_switch: true };
}

/** Admin landing page based on enabled modules. */
export function adminHome(features) {
    const f = features || {};
    if (!f.shop && f.tournaments) return '/admin/tournaments';
    return '/admin/shop';
}

/** Default home after login / role mismatch. */
export function roleHome(role, features) {
    const f = features || {};
    if (role === 'organizer') return '/organizer';
    if (isAdminRole(role)) return adminHome(f);
    if (!f.shop && f.tournaments) return '/tournaments';
    return '/';
}

/** Paths that must stay open in every feature mode. */
export function isSharedPath(pathname) {
    return (
        pathname === '/profile'
        || pathname.endsWith('/profile')
        || pathname === '/admin/settings'
        || pathname === '/admin/shop/settings'
        || pathname.startsWith('/login')
        || pathname.startsWith('/register')
        || pathname.startsWith('/forgot-password')
        || pathname === '/terms'
        || pathname === '/privacy'
    );
}

export function isShopCustomerPath(pathname) {
    return (
        pathname === '/'
        || pathname.startsWith('/shop')
        || pathname === '/cart'
        || pathname === '/orders'
        || pathname.startsWith('/orders/')
        || pathname === '/checkout'
        || pathname === '/wishlist'
        || pathname === '/addresses'
        || pathname === '/search'
    );
}

export function isTournamentPath(pathname) {
    return (
        pathname.startsWith('/tournaments')
        || pathname.startsWith('/player')
        || pathname.startsWith('/organizer')
        || pathname === '/admin'
        || pathname.startsWith('/admin/tournaments')
    );
}

/** Admin shop CRUD — blocked when shop module is off (settings excluded). */
export function isAdminShopPath(pathname) {
    return pathname.startsWith('/admin/shop') && pathname !== '/admin/shop/settings';
}
