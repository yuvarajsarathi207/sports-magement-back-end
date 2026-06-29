import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileMenu from './ProfileMenu';

const playerNav = [
    { to: '/', label: 'Home', icon: '🏠', end: true },
    { to: '/tournaments', label: 'Browse', icon: '🏆' },
    { to: '/profile', label: 'Profile', icon: '👤' },
];

const organizerNav = [
    { to: '/organizer', label: 'Home', icon: '🏠', end: true },
    { to: '/organizer/tournaments', label: 'Events', icon: '📋' },
    { to: '/organizer/tournaments/new', label: 'Create', icon: '➕' },
];

const adminNav = [
    { to: '/admin', label: 'Home', icon: '🏠', end: true },
    { to: '/admin/tournaments', label: 'Review', icon: '✅' },
    { to: '/admin/tournaments?status=pending_approval', label: 'Pending', icon: '⏳' },
];

export default function Layout({ role }) {
    const { user } = useAuth();
    const navItems = role === 'admin' ? adminNav : role === 'organizer' ? organizerNav : playerNav;

    return (
        <div className="app-shell">
            <header className="app-header">
                <div className="header-inner">
                    <div>
                        <p className="header-eyebrow">Keep Playing</p>
                        <h1 className="header-title">Hi, {user?.name?.split(' ')[0]}</h1>
                    </div>
                    <ProfileMenu role={role} />
                </div>
            </header>

            <main className="app-main">
                <Outlet />
            </main>

            <nav className="bottom-nav" aria-label="Main navigation">
                {navItems.map((item) => (
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
