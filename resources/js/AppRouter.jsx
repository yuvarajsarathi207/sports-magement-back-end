import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoaderScreen from './components/LoaderScreen';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Terms from './pages/auth/Terms';
import Privacy from './pages/auth/Privacy';
import RefundPolicy from './pages/auth/RefundPolicy';
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
import AdminSettings from './pages/admin/Settings';
import PaymentReturn from './pages/PaymentReturn';
import ShopProducts from './pages/shop/Products';
import ShopProductDetail from './pages/shop/ProductDetail';
import ShopCart from './pages/shop/Cart';
import ShopCheckout from './pages/shop/Checkout';
import { ShopOrders, ShopOrderDetail } from './pages/shop/Orders';
import AdminCommerceDashboard from './pages/admin/commerce/Dashboard';
import AdminCommerceProducts from './pages/admin/commerce/Products';
import AdminCommerceOrders from './pages/admin/commerce/Orders';
import AdminCommerceInventory from './pages/admin/commerce/Inventory';
import AdminCommerceSettings from './pages/admin/commerce/Settings';
import TurfList from './pages/turf/TurfList';
import TurfDetail from './pages/turf/TurfDetail';
import MyBookings from './pages/turf/MyBookings';
import BookingDetail from './pages/turf/BookingDetail';
import OwnerDashboard from './pages/turf/owner/OwnerDashboard';
import OwnerVenues from './pages/turf/owner/OwnerVenues';
import OwnerVenueForm from './pages/turf/owner/OwnerVenueForm';
import OwnerVenueDetail from './pages/turf/owner/OwnerVenueDetail';
import OwnerBookings from './pages/turf/owner/OwnerBookings';
import AdminTurfOverview from './pages/admin/TurfOverview';
import AdminTurfDashboard from './pages/admin/TurfDashboard';
import AdminTurfDetail from './pages/admin/TurfDetail';
import AdminTurfBookings from './pages/admin/TurfBookings';
import AdminTurfOwners from './pages/admin/TurfOwners';
import AdminAccessPermissions from './pages/admin/AccessPermissions';

function roleHome(role) {
    if (role === 'organizer') return '/organizer';
    if (role === 'admin') return '/admin';
    if (role === 'turf_owner') return '/turf/owner';
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

const shopRoutes = (basePath) => (
    <>
        <Route path="shop" element={<ShopProducts basePath={basePath} />} />
        <Route path="shop/products/:id" element={<ShopProductDetail basePath={basePath} />} />
        <Route path="shop/cart" element={<ShopCart basePath={basePath} />} />
        <Route path="shop/checkout" element={<ShopCheckout basePath={basePath} />} />
        <Route path="shop/orders" element={<ShopOrders basePath={basePath} />} />
        <Route path="shop/orders/:id" element={<ShopOrderDetail basePath={basePath} />} />
    </>
);

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />

            <Route path="/" element={<ProtectedRoute role="player"><Layout role="player" /></ProtectedRoute>}>
                <Route index element={<PlayerDashboard />} />
                <Route path="tournaments" element={<PlayerTournaments />} />
                <Route path="tournaments/:id" element={<PlayerTournamentDetail />} />
                <Route path="profile" element={<PlayerProfile />} />
                {shopRoutes('/shop')}
                <Route path="turf" element={<TurfList basePath="/turf" />} />
                <Route path="turf/bookings" element={<MyBookings basePath="/turf" />} />
                <Route path="turf/bookings/:id" element={<BookingDetail basePath="/turf" />} />
                <Route path="turf/:id" element={<TurfDetail basePath="/turf" />} />
            </Route>

            <Route path="/organizer" element={<ProtectedRoute role="organizer"><Layout role="organizer" /></ProtectedRoute>}>
                <Route index element={<OrganizerDashboard />} />
                <Route path="tournaments" element={<OrganizerTournaments />} />
                <Route path="tournaments/new" element={<OrganizerCreateTournament />} />
                <Route path="tournaments/:id" element={<OrganizerTournamentDetail />} />
                <Route path="profile" element={<PlayerProfile />} />
                {shopRoutes('/organizer/shop')}
                <Route path="turf" element={<TurfList basePath="/organizer/turf" />} />
                <Route path="turf/bookings" element={<MyBookings basePath="/organizer/turf" />} />
                <Route path="turf/bookings/:id" element={<BookingDetail basePath="/organizer/turf" />} />
                <Route path="turf/:id" element={<TurfDetail basePath="/organizer/turf" />} />
            </Route>

            <Route path="/admin" element={<ProtectedRoute role="admin"><Layout role="admin" /></ProtectedRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="tournaments" element={<AdminTournaments />} />
                <Route path="tournaments/:id" element={<AdminTournamentDetail />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="access" element={<AdminAccessPermissions />} />
                <Route path="profile" element={<PlayerProfile />} />
                <Route path="commerce" element={<AdminCommerceDashboard />} />
                <Route path="commerce/products" element={<AdminCommerceProducts />} />
                <Route path="commerce/orders" element={<AdminCommerceOrders />} />
                <Route path="commerce/inventory" element={<AdminCommerceInventory />} />
                <Route path="commerce/settings" element={<AdminCommerceSettings />} />
                <Route path="turf" element={<AdminTurfDashboard />} />
                <Route path="turf/venues" element={<AdminTurfOverview />} />
                <Route path="turf/new" element={<AdminTurfOverview />} />
                <Route path="turf/bookings" element={<AdminTurfBookings />} />
                <Route path="turf/owners" element={<AdminTurfOwners />} />
                <Route path="turf/:id" element={<AdminTurfDetail />} />
            </Route>

            <Route path="/turf" element={<ProtectedRoute role="turf_owner"><Layout role="turf_owner" /></ProtectedRoute>}>
                <Route index element={<TurfList basePath="/turf" />} />
                <Route path="bookings" element={<MyBookings basePath="/turf" />} />
                <Route path="bookings/:id" element={<BookingDetail basePath="/turf" />} />
                <Route path="owner" element={<OwnerDashboard />} />
                <Route path="owner/venues" element={<OwnerVenues />} />
                <Route path="owner/venues/new" element={<OwnerVenueForm />} />
                <Route path="owner/venues/:id" element={<OwnerVenueDetail />} />
                <Route path="owner/bookings" element={<OwnerBookings />} />
                {shopRoutes('/turf/shop')}
                <Route path=":id" element={<TurfDetail basePath="/turf" />} />
            </Route>

            <Route path="/payments/return" element={<ProtectedRoute><PaymentReturn /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
