import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useModule } from '../../context/ModuleContext';
import { adminHome, isAdminRole } from '../../utils/navigation';
import api from '../../api/client';

export default function ShopProfile() {
    const { user, logout } = useAuth();
    const { features } = useModule();
    const navigate = useNavigate();
    const [wishlistCount, setWishlistCount] = useState(0);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        if (!user || !features.shop) return;
        api.get('/shop/wishlist').then((res) => setWishlistCount(res.data.length || 0)).catch(() => {});
    }, [user, features.shop]);

    const handleLogout = async () => {
        await logout();
        setShowLogoutConfirm(false);
        navigate(features.shop ? '/' : '/login');
    };

    if (!user) {
        return (
            <div className="page empty-state">
                <h2>Welcome</h2>
                <p>Sign in to manage orders, addresses, and wishlist.</p>
                <div className="btn-row" style={{ justifyContent: 'center' }}>
                    <button className="btn btn-primary" onClick={() => navigate('/login')}>Login</button>
                    <button className="btn btn-outline" onClick={() => navigate('/register')}>Register</button>
                </div>
                <div className="profile-link-list" style={{ marginTop: 24, textAlign: 'left', maxWidth: 420, marginInline: 'auto' }}>
                    <Link to="/terms" className="profile-link-item">
                        <span className="profile-link-icon">📄</span>
                        <span className="profile-link-text">
                            <strong>Terms & Conditions</strong>
                            <small>Rules for using Keep Playing</small>
                        </span>
                        <span className="profile-link-arrow" aria-hidden>→</span>
                    </Link>
                    <Link to="/privacy" className="profile-link-item">
                        <span className="profile-link-icon">🔒</span>
                        <span className="profile-link-text">
                            <strong>Privacy Policy</strong>
                            <small>How we collect and use your data</small>
                        </span>
                        <span className="profile-link-arrow" aria-hidden>→</span>
                    </Link>
                </div>
            </div>
        );
    }

    const roleLabel = isAdminRole(user.role)
        ? 'Admin'
        : user.role === 'organizer'
            ? 'Organizer'
            : 'Player';

    const panelPath = adminHome(features);
    const panelSubtitle = features.shop && features.tournaments
        ? 'Shop & tournament management'
        : features.shop
            ? 'Shop management'
            : 'Tournament management';

    return (
        <div className="page profile-page">
            <div className="profile-header profile-hero-card">
                <div className="avatar">{user.name?.[0]?.toUpperCase()}</div>
                <div>
                    <h2>{user.name}</h2>
                    <p className="text-muted">{user.email}</p>
                    {user.mobile && <p className="text-muted">{user.mobile}</p>}
                    <span className="badge badge-info">{roleLabel}</span>
                </div>
            </div>

            <section className="profile-section-card">
                <h3 className="profile-section-title">Account</h3>
                <div className="profile-link-list">
                    {features.shop && (
                        <>
                            <Link to="/addresses" className="profile-link-item">
                                <span className="profile-link-icon">📍</span>
                                <span className="profile-link-text">
                                    <strong>Addresses</strong>
                                    <small>Delivery addresses</small>
                                </span>
                                <span className="profile-link-arrow" aria-hidden>→</span>
                            </Link>
                            <Link to="/wishlist" className="profile-link-item">
                                <span className="profile-link-icon">♡</span>
                                <span className="profile-link-text">
                                    <strong>Wishlist</strong>
                                    <small>{wishlistCount} saved item(s)</small>
                                </span>
                                <span className="profile-link-arrow" aria-hidden>→</span>
                            </Link>
                            <Link to="/orders" className="profile-link-item">
                                <span className="profile-link-icon">📦</span>
                                <span className="profile-link-text">
                                    <strong>Orders</strong>
                                    <small>Order history & tracking</small>
                                </span>
                                <span className="profile-link-arrow" aria-hidden>→</span>
                            </Link>
                        </>
                    )}
                    {features.tournaments && user.role === 'player' && (
                        <Link to="/player/dashboard" className="profile-link-item">
                            <span className="profile-link-icon">🏆</span>
                            <span className="profile-link-text">
                                <strong>Tournament dashboard</strong>
                                <small>Your games & subscriptions</small>
                            </span>
                            <span className="profile-link-arrow" aria-hidden>→</span>
                        </Link>
                    )}
                    {features.tournaments && user.role === 'organizer' && (
                        <Link to="/organizer" className="profile-link-item">
                            <span className="profile-link-icon">📋</span>
                            <span className="profile-link-text">
                                <strong>Organizer panel</strong>
                                <small>Manage your events</small>
                            </span>
                            <span className="profile-link-arrow" aria-hidden>→</span>
                        </Link>
                    )}
                    {isAdminRole(user.role) && (
                        <Link to={panelPath} className="profile-link-item">
                            <span className="profile-link-icon">⚙️</span>
                            <span className="profile-link-text">
                                <strong>Admin panel</strong>
                                <small>{panelSubtitle}</small>
                            </span>
                            <span className="profile-link-arrow" aria-hidden>→</span>
                        </Link>
                    )}
                    {isAdminRole(user.role) && (
                        <Link to="/admin/settings" className="profile-link-item">
                            <span className="profile-link-icon">🎛️</span>
                            <span className="profile-link-text">
                                <strong>App settings</strong>
                                <small>Shop, tournaments, or both</small>
                            </span>
                            <span className="profile-link-arrow" aria-hidden>→</span>
                        </Link>
                    )}
                </div>
            </section>

            <section className="profile-section-card">
                <h3 className="profile-section-title">Legal</h3>
                <div className="profile-link-list">
                    <Link to="/terms" className="profile-link-item">
                        <span className="profile-link-icon">📄</span>
                        <span className="profile-link-text">
                            <strong>Terms & Conditions</strong>
                            <small>Rules for using Keep Playing</small>
                        </span>
                        <span className="profile-link-arrow" aria-hidden>→</span>
                    </Link>
                    <Link to="/privacy" className="profile-link-item">
                        <span className="profile-link-icon">🔒</span>
                        <span className="profile-link-text">
                            <strong>Privacy Policy</strong>
                            <small>How we collect and use your data</small>
                        </span>
                        <span className="profile-link-arrow" aria-hidden>→</span>
                    </Link>
                </div>
            </section>

            <button
                type="button"
                className="btn btn-outline btn-block"
                onClick={() => setShowLogoutConfirm(true)}
            >
                Log out
            </button>

            {showLogoutConfirm && (
                <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
                    <div
                        className="modal-card"
                        role="dialog"
                        aria-labelledby="logout-title"
                        aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-icon">👋</div>
                        <h2 id="logout-title" className="modal-title">Log out?</h2>
                        <p className="modal-text">
                            Are you sure you want to log out of <strong>{user?.name}</strong>?
                        </p>
                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn btn-outline btn-block"
                                onClick={() => setShowLogoutConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger btn-block"
                                onClick={handleLogout}
                            >
                                Yes, Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
