import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlatformSettings } from '../context/SettingsContext';
import ProfileMenu from './ProfileMenu';

const playerNav = [
    { to: '/', label: 'Dashboard', icon: '🏠', end: true },
    { to: '/tournaments', label: 'Browse', icon: '🏆' },
    { to: '/profile', label: 'Profile', icon: '👤' },
];

const organizerNav = [
    { to: '/organizer', label: 'Dashboard', icon: '🏠', end: true },
    { to: '/organizer/tournaments', label: 'Events', icon: '📋' },
    { to: '/organizer/tournaments/new', label: 'Create', icon: '➕' },
    { to: '/organizer/profile', label: 'Profile', icon: '👤' },
];

const adminNav = [
    { to: '/admin', label: 'Dashboard', icon: '🏠', end: true },
    { to: '/admin/tournaments', label: 'Review', icon: '✅' },
    { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
    { to: '/admin/profile', label: 'Profile', icon: '👤' },
];

const roleLabels = {
    player: 'Player',
    organizer: 'Organizer',
    admin: 'Admin',
};

export default function Layout({ role }) {
    const { user } = useAuth();
    const { settings } = usePlatformSettings();
    const navItems = role === 'admin' ? adminNav : role === 'organizer' ? organizerNav : playerNav;
    const firstName = user?.name?.split(' ')[0] || 'there';
    const brandName = settings?.platform_name || 'Keep Playing';

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
                    {navItems.map((item) => (
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
                        <ProfileMenu role={role} />
                    </div>
                </header>

                <main className="app-main">
                    <Outlet />
                </main>
            </div>

            <nav className="bottom-nav" aria-label="Main navigation">
                {navItems.slice(0, 3).map((item) => (
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
