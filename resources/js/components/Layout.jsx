import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useModule } from '../context/ModuleContext';
import ProfileMenu from './ProfileMenu';

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
        ];
    }
    if (user.role === 'admin' || user.role === 'super_admin') {
        return [
            { to: '/admin/tournaments', label: 'All Tournaments' },
            { to: '/admin/tournaments?status=pending_approval', label: 'Pending' },
        ];
    }
    return [
        { to: '/tournaments', label: 'Browse' },
        { to: '/player/dashboard', label: 'My Games' },
        { to: '/player/profile', label: 'Player Profile' },
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
    ];
}

export default function Layout({ role = 'shop' }) {
    const { user } = useAuth();
    const { module, switchModule, isShop } = useModule();
    const navigate = useNavigate();
    const isAdmin = role === 'admin' || user?.role === 'admin' || user?.role === 'super_admin';

    const links = isAdmin && isShop
        ? adminShopLinks()
        : isShop
            ? shopLinks(user)
            : tournamentLinks(user);

    const profileRole = user?.role === 'admin' || user?.role === 'super_admin'
        ? 'admin'
        : user?.role === 'organizer'
            ? 'organizer'
            : 'player';

    return (
        <div className={`site-shell${isAdmin ? ' site-shell-admin' : ''}`}>
            <header className="site-header">
                <div className="site-header-bar">
                    <Link to={isAdmin ? (isShop ? '/admin/shop' : '/admin/tournaments') : '/'} className="site-brand">
                        <span className="site-brand-mark">KP</span>
                        <span className="site-brand-text">
                            <strong>Keep Playing</strong>
                            <small>{isShop ? 'Store' : 'Tournaments'}</small>
                        </span>
                    </Link>

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

                    <div className="site-header-actions">
                        {isShop && !isAdmin && (
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
                    <div>
                        <strong>Keep Playing</strong>
                        <p>Shop gear and join tournaments with one account.</p>
                    </div>
                    <div className="site-footer-links">
                        <button type="button" className="btn-link" onClick={() => switchModule('shop')}>Shop</button>
                        <button type="button" className="btn-link" onClick={() => switchModule('tournaments')}>Tournaments</button>
                        <Link to="/terms">Terms</Link>
                    </div>
                </div>
            </footer>

            {/* Mobile quick bar */}
            <nav className="site-mobile-bar" aria-label="Quick navigation">
                {isShop ? (
                    <>
                        <NavLink to={isAdmin ? '/admin/shop' : '/'} end className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
                            <span className="nav-icon">🏠</span><span className="nav-label">Home</span>
                        </NavLink>
                        <NavLink to={isAdmin ? '/admin/shop/products' : '/shop/products'} className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
                            <span className="nav-icon">🛍️</span><span className="nav-label">Shop</span>
                        </NavLink>
                        {!isAdmin && (
                            <NavLink to="/cart" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
                                <span className="nav-icon">🛒</span><span className="nav-label">Cart</span>
                            </NavLink>
                        )}
                        <button type="button" className="bottom-nav-item" onClick={() => switchModule('tournaments')}>
                            <span className="nav-icon">🏆</span><span className="nav-label">Play</span>
                        </button>
                        <NavLink to={isAdmin ? '/admin/shop/orders' : '/profile'} className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
                            <span className="nav-icon">👤</span><span className="nav-label">{isAdmin ? 'Orders' : 'Account'}</span>
                        </NavLink>
                    </>
                ) : (
                    <>
                        <button type="button" className="bottom-nav-item" onClick={() => switchModule('shop')}>
                            <span className="nav-icon">🛍️</span><span className="nav-label">Shop</span>
                        </button>
                        {tournamentLinks(user).slice(0, 3).map((item) => (
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
