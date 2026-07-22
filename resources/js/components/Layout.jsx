import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useModule } from '../context/ModuleContext';
import { useSettings } from '../context/SettingsContext';
import { adminHome, isAdminRole } from '../utils/navigation';
import ProfileMenu from './ProfileMenu';
import BrandLogo from './BrandLogo';

function shopLinks(user) {
    return [
        { to: '/', label: 'Home', end: true },
        { to: '/shop/products', label: 'Products' },
        { to: '/cart', label: 'Cart' },
        { to: '/orders', label: 'Orders' },
        { to: '/wishlist', label: 'Wishlist', auth: true },
        { to: '/profile', label: 'Account' },
    ].filter((l) => !l.auth || user);
}

function tournamentLinks(user) {
    if (!user) {
        return [{ to: '/login', label: 'Login to play' }];
    }
    if (user.role === 'organizer') {
        return [
            { to: '/organizer', label: 'Dashboard', end: true },
            { to: '/organizer/tournaments', label: 'My Events' },
            { to: '/organizer/tournaments/new', label: 'Create' },
            { to: '/organizer/profile', label: 'Account' },
        ];
    }
    if (isAdminRole(user.role)) {
        return [
            { to: '/admin/tournaments', label: 'All Tournaments' },
            { to: '/admin/tournaments?status=pending_approval', label: 'Pending' },
            { to: '/admin/settings', label: 'Settings' },
            { to: '/admin/profile', label: 'Account' },
        ];
    }
    return [
        { to: '/tournaments', label: 'Browse' },
        { to: '/player/dashboard', label: 'My Games' },
        { to: '/profile', label: 'Account' },
    ];
}

function adminShopLinks() {
    return [
        { to: '/admin/shop', label: 'Overview', end: true },
        { to: '/admin/shop/products', label: 'Products' },
        { to: '/admin/shop/categories', label: 'Categories' },
        { to: '/admin/shop/banners', label: 'Banners' },
        { to: '/admin/shop/orders', label: 'Orders' },
        { to: '/admin/shop/customers', label: 'Users' },
        { to: '/admin/shop/reports', label: 'Reports' },
        { to: '/admin/settings', label: 'Settings' },
        { to: '/admin/profile', label: 'Account' },
    ];
}

export default function Layout({ role = 'shop' }) {
    const { user } = useAuth();
    const { switchModule, isShop, features } = useModule();
    const { settings } = useSettings();
    const navigate = useNavigate();
    const onAdminShell = role === 'admin';
    const isAdminUser = isAdminRole(user?.role);
    const showAdminShopNav = onAdminShell && isShop && features.shop;

    const links = showAdminShopNav
        ? adminShopLinks()
        : isShop && features.shop
            ? shopLinks(user)
            : tournamentLinks(user);

    const profileRole = isAdminUser
        ? 'admin'
        : user?.role === 'organizer'
            ? 'organizer'
            : 'player';

    const brandHome = isAdminUser
        ? adminHome(features)
        : (features.shop ? '/' : (user ? (user.role === 'organizer' ? '/organizer' : '/tournaments') : '/login'));

    return (
        <div className={`site-shell${onAdminShell ? ' site-shell-admin' : ''}`}>
            <header className="site-header">
                <div className="site-header-bar">
                    <Link to={brandHome} className="site-brand">
                        <BrandLogo className="site-brand-logo" size={128} alt={settings.app_name || 'Keep Playing'} priority />
                        <span className="site-brand-text">
                            <strong>{settings.app_name || 'Keep Playing'}</strong>
                            <small>
                                {onAdminShell
                                    ? 'Admin'
                                    : !features.module_switch
                                        ? (features.shop ? 'Store' : 'Tournaments')
                                        : (isShop ? 'Store' : 'Tournaments')}
                            </small>
                        </span>
                    </Link>

                    {features.module_switch && (
                        <div className="module-switch" role="group" aria-label="Module switch">
                            <button
                                type="button"
                                className={`module-switch-btn${isShop ? ' active' : ''}`}
                                onClick={() => switchModule('shop')}
                            >
                                🛍️ Shop
                            </button>
                            <button
                                type="button"
                                className={`module-switch-btn${!isShop ? ' active' : ''}`}
                                onClick={() => switchModule('tournaments')}
                            >
                                🏆 Tournaments
                            </button>
                        </div>
                    )}

                    <div className="site-header-actions">
                        {isShop && !onAdminShell && features.shop && (
                            <button
                                type="button"
                                className="site-search-btn"
                                onClick={() => navigate('/search')}
                            >
                                🔍 Search
                            </button>
                        )}
                        {user ? (
                            <ProfileMenu role={profileRole} />
                        ) : (
                            <div className="site-auth-btns">
                                <button type="button" className="btn btn-outline btn-sm light" onClick={() => navigate('/login')}>
                                    Login
                                </button>
                                <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>
                                    Register
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <nav className="site-nav" aria-label="Primary">
                    <div className="site-nav-inner">
                        {links.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) => `site-nav-link${isActive ? ' active' : ''}`}
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                </nav>
            </header>

            <main className="site-main">
                <div className="site-container">
                    <Outlet />
                </div>
            </main>

            <footer className="site-footer">
                <div className="site-container site-footer-inner">
                    <div className="site-footer-brand">
                        <BrandLogo className="site-footer-logo" size={64} alt="" />
                        <div>
                            <strong>{settings.app_name || 'Keep Playing'}</strong>
                            <p>
                                {features.module_switch
                                    ? 'Shop gear and join tournaments with one account.'
                                    : features.shop
                                        ? 'Your sports store.'
                                        : 'Find and join tournaments.'}
                            </p>
                        </div>
                    </div>
                    <div className="site-footer-links">
                        {features.shop && (
                            <button type="button" className="btn-link" onClick={() => (features.module_switch ? switchModule('shop') : navigate(isAdminUser ? adminHome(features) : '/'))}>
                                Shop
                            </button>
                        )}
                        {features.tournaments && (
                            <button type="button" className="btn-link" onClick={() => (features.module_switch ? switchModule('tournaments') : navigate(user ? (isAdminUser ? '/admin/tournaments' : '/tournaments') : '/login'))}>
                                Tournaments
                            </button>
                        )}
                        {isAdminUser && <Link to={adminHome(features)}>Admin</Link>}
                        {isAdminUser && <Link to="/admin/settings">Settings</Link>}
                        <Link to="/terms">Terms</Link>
                        <Link to="/privacy">Privacy</Link>
                    </div>
                </div>
            </footer>

            <nav className="site-mobile-bar" aria-label="Quick navigation">
                {showAdminShopNav ? (
                    <>
                        <NavLink to="/admin/shop" end className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
                            <span className="nav-icon">🏠</span><span className="nav-label">Home</span>
                        </NavLink>
                        <NavLink to="/admin/shop/products" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
                            <span className="nav-icon">🛍️</span><span className="nav-label">Shop</span>
                        </NavLink>
                        <NavLink to="/admin/settings" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
                            <span className="nav-icon">⚙️</span><span className="nav-label">Settings</span>
                        </NavLink>
                        <NavLink to="/admin/profile" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
                            <span className="nav-icon">👤</span><span className="nav-label">Account</span>
                        </NavLink>
                    </>
                ) : isShop && features.shop ? (
                    <>
                        <NavLink to="/" end className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
                            <span className="nav-icon">🏠</span><span className="nav-label">Home</span>
                        </NavLink>
                        <NavLink to="/shop/products" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
                            <span className="nav-icon">🛍️</span><span className="nav-label">Shop</span>
                        </NavLink>
                        <NavLink to="/cart" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
                            <span className="nav-icon">🛒</span><span className="nav-label">Cart</span>
                        </NavLink>
                        {features.module_switch && (
                            <button type="button" className="bottom-nav-item" onClick={() => switchModule('tournaments')}>
                                <span className="nav-icon">🏆</span><span className="nav-label">Play</span>
                            </button>
                        )}
                        <NavLink to="/profile" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
                            <span className="nav-icon">👤</span><span className="nav-label">Account</span>
                        </NavLink>
                    </>
                ) : (
                    <>
                        {features.module_switch && (
                            <button type="button" className="bottom-nav-item" onClick={() => switchModule('shop')}>
                                <span className="nav-icon">🛍️</span><span className="nav-label">Shop</span>
                            </button>
                        )}
                        {tournamentLinks(user).slice(0, 4).map((item) => (
                            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
                                <span className="nav-icon">•</span><span className="nav-label">{item.label}</span>
                            </NavLink>
                        ))}
                    </>
                )}
            </nav>
        </div>
    );
}
