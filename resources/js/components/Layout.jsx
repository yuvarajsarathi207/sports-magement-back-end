import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlatformSettings } from '../context/SettingsContext';
import { useModules } from '../context/ModuleContext';
import ProfileMenu from './ProfileMenu';
import ModuleSwitcher from './ModuleSwitcher';

const playerNav = {
    tournament: [
        { to: '/', label: 'Dashboard', icon: '🏠', end: true },
        { to: '/tournaments', label: 'Browse', icon: '🏆' },
        { to: '/profile', label: 'Profile', icon: '👤' },
    ],
    shop: [
        { to: '/shop', label: 'Products', icon: '🛒', end: true },
        { to: '/shop/cart', label: 'Cart', icon: '🧺' },
        { to: '/shop/orders', label: 'Orders', icon: '📦' },
        { to: '/profile', label: 'Profile', icon: '👤' },
    ],
    turf: [
        { to: '/turf', label: 'Venues', icon: '🏟️', end: true },
        { to: '/turf/bookings', label: 'My Bookings', icon: '📅' },
        { to: '/profile', label: 'Profile', icon: '👤' },
    ],
};

const organizerNav = {
    tournament: [
        { to: '/organizer', label: 'Dashboard', icon: '🏠', end: true },
        { to: '/organizer/tournaments', label: 'Events', icon: '📋' },
        { to: '/organizer/tournaments/new', label: 'Create', icon: '➕' },
        { to: '/organizer/profile', label: 'Profile', icon: '👤' },
    ],
    shop: [
        { to: '/organizer/shop', label: 'Products', icon: '🛒', end: true },
        { to: '/organizer/shop/cart', label: 'Cart', icon: '🧺' },
        { to: '/organizer/shop/orders', label: 'Orders', icon: '📦' },
        { to: '/organizer/profile', label: 'Profile', icon: '👤' },
    ],
    turf: [
        { to: '/organizer/turf', label: 'Venues', icon: '🏟️', end: true },
        { to: '/organizer/turf/bookings', label: 'Bookings', icon: '📅' },
        { to: '/organizer/profile', label: 'Profile', icon: '👤' },
    ],
};

const adminNav = {
    tournament: [
        { to: '/admin', label: 'Dashboard', icon: '🏠', end: true },
        { to: '/admin/tournaments', label: 'Review', icon: '✅' },
        { to: '/admin/access', label: 'Access', icon: '🔐' },
        { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
        { to: '/admin/profile', label: 'Profile', icon: '👤' },
    ],
    shop: [
        { to: '/admin/commerce', label: 'Dashboard', icon: '🏠', end: true },
        { to: '/admin/commerce/products', label: 'Products', icon: '🏷️' },
        { to: '/admin/commerce/orders', label: 'Orders', icon: '📦' },
        { to: '/admin/commerce/inventory', label: 'Inventory', icon: '📊' },
        { to: '/admin/access', label: 'Access', icon: '🔐' },
    ],
    turf: [
        { to: '/admin/turf', label: 'Dashboard', icon: '🏠', end: true },
        { to: '/admin/turf/venues', label: 'Venues', icon: '🏟️' },
        { to: '/admin/turf/bookings', label: 'Bookings', icon: '📅' },
        { to: '/admin/turf/owners', label: 'Owners', icon: '👤' },
        { to: '/admin/turf/new', label: 'Add Turf', icon: '➕' },
        { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
    ],
};

const turfOwnerNav = {
    tournament: [
        { to: '/turf', label: 'Browse Turfs', icon: '🏟️', end: true },
        { to: '/turf/bookings', label: 'My Bookings', icon: '📅' },
    ],
    shop: [
        { to: '/turf/shop', label: 'Shop', icon: '🛒', end: true },
        { to: '/turf/shop/orders', label: 'Orders', icon: '📦' },
    ],
    turf: [
        { to: '/turf/owner', label: 'Dashboard', icon: '🏠', end: true },
        { to: '/turf/owner/venues', label: 'My Venues', icon: '🏟️' },
        { to: '/turf/owner/venues/new', label: 'Add Venue', icon: '➕' },
        { to: '/turf/owner/bookings', label: 'Bookings', icon: '📅' },
        { to: '/turf/bookings', label: 'My Bookings', icon: '🎫' },
    ],
};

const roleLabels = {
    player: 'Player',
    organizer: 'Organizer',
    admin: 'Admin',
    turf_owner: 'Turf Owner',
};

function navFor(role, module) {
    if (role === 'admin') return adminNav[module] || adminNav.tournament;
    if (role === 'organizer') return organizerNav[module] || organizerNav.tournament;
    if (role === 'turf_owner') return turfOwnerNav[module] || turfOwnerNav.turf;
    return playerNav[module] || playerNav.tournament;
}

export default function Layout({ role }) {
    const { user } = useAuth();
    const { settings } = usePlatformSettings();
    const { currentModule } = useModules();
    const navItems = navFor(role, currentModule);
    const firstName = user?.name?.split(' ')[0] || 'there';
    const brandName = settings?.platform_name || 'Keep Playing';
    const commerceEnabled = settings?.commerce_enabled !== false;
    const turfEnabled = settings?.turf_enabled !== false;

    const visibleNav = navItems.filter((item) => {
        const path = String(item.to);
        if (!commerceEnabled && (path.includes('shop') || path.includes('commerce'))) return false;
        if (!turfEnabled && path.includes('turf')) return false;
        return true;
    });

    return (
        <div className="app-shell">
            <aside className="sidebar" aria-label="Desktop navigation">
                <div className="sidebar-brand">
                    <span className="sidebar-brand-icon" aria-hidden="true">⚽</span>
                    <div>
                        <p className="sidebar-brand-name">{brandName}</p>
                        <p className="sidebar-brand-role">{roleLabels[role] || 'App'}</p>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {visibleNav.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <p className="sidebar-user-name">{user?.name}</p>
                    <p className="sidebar-user-meta">{user?.email || user?.mobile || ''}</p>
                </div>
            </aside>

            <div className="app-content">
                <header className="app-header">
                    <div className="header-inner">
                        <div>
                            <p className="header-eyebrow">{brandName} · {roleLabels[role]}</p>
                            <h1 className="header-title">Hi, {firstName}</h1>
                        </div>
                        <div className="header-actions">
                            <ModuleSwitcher />
                            <ProfileMenu role={role} />
                        </div>
                    </div>
                </header>

                <main className="app-main">
                    <Outlet />
                </main>
            </div>

            <nav className="bottom-nav" aria-label="Main navigation">
                {visibleNav.slice(0, 3).map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
