import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function profilePathFor(role) {
    if (role === 'organizer') return '/organizer/profile';
    if (role === 'admin') return '/admin/profile';
    return '/profile';
}

export default function ProfileMenu({ role }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const initial = user?.name?.charAt(0)?.toUpperCase() || '?';

    return (
        <button
            type="button"
            className="profile-trigger"
            onClick={() => navigate(profilePathFor(role))}
            aria-label="Open profile page"
            title="Profile"
        >
            <span className="profile-trigger-avatar">{initial}</span>
        </button>
    );
}
