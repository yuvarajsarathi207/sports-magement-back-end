import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useSettings } from './context/SettingsContext';
import { featuresFromSettings, roleHome } from './utils/navigation';
import Layout from './components/Layout';
import LoaderScreen from './components/LoaderScreen';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Terms from './pages/auth/Terms';
import Privacy from './pages/auth/Privacy';
import RefundPolicy from './pages/auth/RefundPolicy';
import Privacy from './pages/auth/Privacy';
import ShopHome from './pages/shop/Home';
import ProductList from './pages/shop/ProductList';
import ProductDetail from './pages/shop/ProductDetail';
import Search from './pages/shop/Search';
import Cart from './pages/shop/Cart';
import Checkout from './pages/shop/checkout/Checkout';
import Orders from './pages/shop/orders/Orders';
import OrderDetail from './pages/shop/orders/OrderDetail';
import OrderSuccess from './pages/shop/orders/OrderSuccess';
import ShopProfile from './pages/shop/Profile';
import Addresses from './pages/shop/Addresses';
import Wishlist from './pages/shop/Wishlist';
import PlayerDashboard from './pages/player/Dashboard';
import PlayerTournaments from './pages/player/Tournaments';
import PlayerTournamentDetail from './pages/player/TournamentDetail';
import PlayerProfile from './pages/player/Profile';
import OrganizerDashboard from './pages/organizer/Dashboard';
import OrganizerTournaments from './pages/organizer/Tournaments';
import OrganizerCreateTournament from './pages/organizer/CreateTournament';
import OrganizerTournamentDetail from './pages/organizer/TournamentDetail';
import AdminTournaments from './pages/admin/Tournaments';
import AdminTournamentDetail from './pages/admin/TournamentDetail';
import AdminShopDashboard from './pages/admin/shop/Dashboard';
import AdminProducts from './pages/admin/shop/Products';
import AdminCategories from './pages/admin/shop/Categories';
import AdminBanners from './pages/admin/shop/Banners';
import AdminOrders from './pages/admin/shop/Orders';
import AdminCustomers from './pages/admin/shop/Customers';
import AdminReports from './pages/admin/shop/Reports';
import AdminSettings from './pages/admin/shop/Settings';

function ProtectedRoute({ children, role, roles }) {
    const { user, loading } = useAuth();
    const { settings } = useSettings();

    if (loading) {
        return <LoaderScreen message="Starting app..." fullScreen />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const allowed = roles || (role ? [role] : null);
    if (allowed && !allowed.includes(user.role)) {
        return <Navigate to={roleHome(user.role, featuresFromSettings(settings))} replace />;
    }

    return children;
}

function GuestRoute({ children }) {
    const { user, loading } = useAuth();
    const { settings } = useSettings();

    if (loading) {
        return <LoaderScreen message="Starting app..." fullScreen />;
    }

    if (user) {
        return <Navigate to={roleHome(user.role, featuresFromSettings(settings))} replace />;
    }

    return children;
}

function AuthOnly({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <LoaderScreen message="Starting app..." fullScreen />;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

function AdminIndexRedirect() {
    const { settings, loading } = useSettings();
    if (loading) return <LoaderScreen message="Starting app..." />;
    return <Navigate to={roleHome('admin', featuresFromSettings(settings))} replace />;
}

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
            <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/privacy" element={<Privacy />} />

            {/* Public e-commerce shell — works without login */}
            <Route path="/" element={<Layout role="shop" title="Store" />}>
                <Route index element={<ShopHome />} />
                <Route path="search" element={<Search />} />
                <Route path="shop/products" element={<ProductList />} />
                <Route path="shop/products/:id" element={<ProductDetail />} />
                <Route path="cart" element={<Cart />} />
                <Route path="orders" element={<Orders />} />
                <Route path="orders/:id" element={<AuthOnly><OrderDetail /></AuthOnly>} />
                <Route path="orders/:id/success" element={<AuthOnly><OrderSuccess /></AuthOnly>} />
                <Route path="checkout" element={<AuthOnly><Checkout /></AuthOnly>} />
                <Route path="addresses" element={<AuthOnly><Addresses /></AuthOnly>} />
                <Route path="wishlist" element={<AuthOnly><Wishlist /></AuthOnly>} />
                <Route path="profile" element={<ShopProfile />} />
                <Route path="tournaments" element={<ProtectedRoute role="player"><PlayerTournaments /></ProtectedRoute>} />
                <Route path="tournaments/:id" element={<ProtectedRoute role="player"><PlayerTournamentDetail /></ProtectedRoute>} />
            </Route>

            <Route path="/player" element={<ProtectedRoute role="player"><Layout role="shop" /></ProtectedRoute>}>
                <Route path="dashboard" element={<PlayerDashboard />} />
                <Route path="profile" element={<PlayerProfile />} />
            </Route>

            <Route path="/organizer" element={<ProtectedRoute role="organizer"><Layout role="organizer" /></ProtectedRoute>}>
                <Route index element={<OrganizerDashboard />} />
                <Route path="tournaments" element={<OrganizerTournaments />} />
                <Route path="tournaments/new" element={<OrganizerCreateTournament />} />
                <Route path="tournaments/:id" element={<OrganizerTournamentDetail />} />
                <Route path="profile" element={<ShopProfile />} />
                <Route path="profile" element={<PlayerProfile />} />
            </Route>

            <Route path="/admin" element={<ProtectedRoute roles={['admin', 'super_admin']}><Layout role="admin" /></ProtectedRoute>}>
                <Route index element={<AdminIndexRedirect />} />
                <Route path="tournaments" element={<AdminTournaments />} />
                <Route path="tournaments/:id" element={<AdminTournamentDetail />} />
                <Route path="profile" element={<PlayerProfile />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="shop" element={<AdminShopDashboard />} />
                <Route path="shop/products" element={<AdminProducts />} />
                <Route path="shop/categories" element={<AdminCategories />} />
                <Route path="shop/banners" element={<AdminBanners />} />
                <Route path="shop/orders" element={<AdminOrders />} />
                <Route path="shop/orders/:id" element={<AdminOrders />} />
                <Route path="shop/customers" element={<AdminCustomers />} />
                <Route path="shop/reports" element={<AdminReports />} />
                <Route path="shop/settings" element={<Navigate to="/admin/settings" replace />} />
                <Route path="profile" element={<ShopProfile />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
