import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoaderScreen from './components/LoaderScreen';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PlayerDashboard from './pages/player/Dashboard';
import PlayerTournaments from './pages/player/Tournaments';
import PlayerTournamentDetail from './pages/player/TournamentDetail';
import PlayerProfile from './pages/player/Profile';
import OrganizerDashboard from './pages/organizer/Dashboard';
import OrganizerTournaments from './pages/organizer/Tournaments';
import OrganizerCreateTournament from './pages/organizer/CreateTournament';
import OrganizerTournamentDetail from './pages/organizer/TournamentDetail';
import AdminDashboard from './pages/admin/Dashboard';
import AdminTournaments from './pages/admin/Tournaments';
import AdminTournamentDetail from './pages/admin/TournamentDetail';

function roleHome(role) {
    if (role === 'organizer') return '/organizer';
    if (role === 'admin') return '/admin';
    return '/';
}

function ProtectedRoute({ children, role }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoaderScreen message="Starting app..." fullScreen />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (role && user.role !== role) {
        return <Navigate to={roleHome(user.role)} replace />;
    }

    return children;
}

function GuestRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoaderScreen message="Starting app..." fullScreen />;
    }

    if (user) {
        return <Navigate to={roleHome(user.role)} replace />;
    }

    return children;
}

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

            <Route path="/" element={<ProtectedRoute role="player"><Layout role="player" /></ProtectedRoute>}>
                <Route index element={<PlayerDashboard />} />
                <Route path="tournaments" element={<PlayerTournaments />} />
                <Route path="tournaments/:id" element={<PlayerTournamentDetail />} />
                <Route path="profile" element={<PlayerProfile />} />
            </Route>

            <Route path="/organizer" element={<ProtectedRoute role="organizer"><Layout role="organizer" /></ProtectedRoute>}>
                <Route index element={<OrganizerDashboard />} />
                <Route path="tournaments" element={<OrganizerTournaments />} />
                <Route path="tournaments/new" element={<OrganizerCreateTournament />} />
                <Route path="tournaments/:id" element={<OrganizerTournamentDetail />} />
            </Route>

            <Route path="/admin" element={<ProtectedRoute role="admin"><Layout role="admin" /></ProtectedRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="tournaments" element={<AdminTournaments />} />
                <Route path="tournaments/:id" element={<AdminTournamentDetail />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
