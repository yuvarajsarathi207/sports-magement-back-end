import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useModule } from '../context/ModuleContext';

function profilePathFor(role, features) {
    if (features && !features.tournaments) {
        return role === 'admin' ? '/admin/profile' : '/profile';
    }
    if (role === 'organizer') return '/organizer/profile';
    if (role === 'admin') return '/admin/profile';
    return '/profile';
}

/** Header avatar opens the profile page (no popup). */
function profilePathFor(role) {
    if (role === 'organizer') return '/organizer/profile';
    if (role === 'admin') return '/admin/profile';
    return '/profile';
}

export default function ProfileMenu({ role }) {
    const { user } = useAuth();
    const { features } = useModule();
    const navigate = useNavigate();
    const initial = user?.name?.charAt(0)?.toUpperCase() || '?';

    return (
        <button
            type="button"
            className="profile-trigger"
            onClick={() => navigate(profilePathFor(role, features))}
            aria-label="Open profile page"
            title="Profile"
        >
            <span className="profile-trigger-avatar">{initial}</span>
        </button>
    );
}
