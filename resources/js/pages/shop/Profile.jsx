import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function ShopProfile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [wishlistCount, setWishlistCount] = useState(0);

    useEffect(() => {
        if (!user) return;
        api.get('/shop/wishlist').then((res) => setWishlistCount(res.data.length || 0)).catch(() => {});
    }, [user]);

    if (!user) {
        return (
            <div className="page empty-state">
                <h2>Welcome</h2>
                <p>Sign in to manage orders, addresses, and wishlist.</p>
                <div className="btn-row" style={{ justifyContent: 'center' }}>
                    <button className="btn btn-primary" onClick={() => navigate('/login')}>Login</button>
                    <button className="btn btn-outline" onClick={() => navigate('/register')}>Register</button>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="profile-hero">
                <div className="avatar">{user.name?.[0]?.toUpperCase()}</div>
                <div>
                    <h2>{user.name}</h2>
                    <p className="text-muted">{user.email}</p>
                    <span className="badge badge-info">{user.role}</span>
                </div>
            </div>

            <div className="list-menu">
                <Link to="/addresses" className="list-menu-item">📍 Addresses</Link>
                <Link to="/wishlist" className="list-menu-item">♡ Wishlist ({wishlistCount})</Link>
                <Link to="/orders" className="list-menu-item">📦 Orders</Link>
                {(user.role === 'player') && (
                    <Link to="/player/dashboard" className="list-menu-item">🏆 Tournament dashboard</Link>
                )}
                {(user.role === 'organizer') && (
                    <Link to="/organizer" className="list-menu-item">📋 Organizer panel</Link>
                )}
                {(user.role === 'admin' || user.role === 'super_admin') && (
                    <Link to="/admin" className="list-menu-item">⚙️ Admin panel</Link>
                )}
            </div>

            <button
                type="button"
                className="btn btn-outline btn-block"
                onClick={async () => {
                    await logout();
                    navigate('/');
                }}
            >
                Logout
            </button>
        </div>
    );
}
