import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProfileMenu({ role }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setOpen(false);
                setShowLogoutConfirm(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    const handleLogout = async () => {
        await logout();
        setShowLogoutConfirm(false);
        setOpen(false);
        navigate('/login');
    };

    const profilePath = role === 'player' ? '/profile' : null;
    const initial = user?.name?.charAt(0)?.toUpperCase() || '?';

    return (
        <>
            <div className="profile-menu" ref={menuRef}>
                <button
                    type="button"
                    className={`profile-trigger${open ? ' active' : ''}`}
                    onClick={() => setOpen((prev) => !prev)}
                    aria-label="Open profile menu"
                    aria-expanded={open}
                >
                    <span className="profile-trigger-avatar">{initial}</span>
                </button>

                {open && (
                    <div className="profile-dropdown">
                        <div className="profile-dropdown-header">
                            <span className="profile-dropdown-avatar">{initial}</span>
                            <div>
                                <p className="profile-dropdown-name">{user?.name}</p>
                                <span className={`badge badge-${role === 'admin' ? 'danger' : role === 'organizer' ? 'warning' : 'info'}`}>
                                    {role}
                                </span>
                            </div>
                        </div>

                        <ul className="profile-dropdown-details">
                            <li>
                                <span className="detail-icon">✉️</span>
                                <span>{user?.email}</span>
                            </li>
                            {user?.mobile && (
                                <li>
                                    <span className="detail-icon">📱</span>
                                    <span>{user.mobile}</span>
                                </li>
                            )}
                        </ul>

                        <div className="profile-dropdown-actions">
                            {profilePath && (
                                <button
                                    type="button"
                                    className="profile-action-btn"
                                    onClick={() => {
                                        setOpen(false);
                                        navigate(profilePath);
                                    }}
                                >
                                    Edit Profile
                                </button>
                            )}
                            <button
                                type="button"
                                className="profile-action-btn profile-action-logout"
                                onClick={() => {
                                    setOpen(false);
                                    setShowLogoutConfirm(true);
                                }}
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                )}
            </div>

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
        </>
    );
}
