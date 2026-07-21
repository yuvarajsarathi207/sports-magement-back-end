import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/client';
import LoaderScreen from '../../../components/LoaderScreen';
import StatusStats from '../../../components/StatusStats';

export default function AdminShopDashboard() {
    const [data, setData] = useState(null);

    useEffect(() => {
        api.get('/admin/shop/dashboard').then((res) => setData(res.data));
    }, []);

    if (!data) return <LoaderScreen message="Loading shop analytics..." />;

    const s = data.stats;
    const items = [
        { value: s.total_revenue, label: 'Revenue', icon: '💰', tone: 'success' },
        { value: s.total_orders, label: 'Orders', icon: '📦', tone: 'info' },
        { value: s.total_products, label: 'Products', icon: '🛍️', tone: 'warning' },
        { value: s.total_users, label: 'Users', icon: '👥', tone: 'info' },
        { value: s.total_categories, label: 'Categories', icon: '🏷️', tone: 'success' },
        { value: s.active_tournaments, label: 'Tournaments', icon: '🏆', tone: 'warning' },
    ];

    return (
        <div className="page">
            <h2 className="section-title">Shop Dashboard</h2>
            <StatusStats items={items} />

            <div className="list-menu">
                <Link to="/admin/shop/products" className="list-menu-item">Products</Link>
                <Link to="/admin/shop/categories" className="list-menu-item">Categories</Link>
                <Link to="/admin/shop/banners" className="list-menu-item">Banners</Link>
                <Link to="/admin/shop/orders" className="list-menu-item">Orders ({s.pending_orders} pending)</Link>
                <Link to="/admin/shop/customers" className="list-menu-item">Users</Link>
                <Link to="/admin/shop/reports" className="list-menu-item">Reports</Link>
            </div>

            <section className="section">
                <h3 className="section-title">Recent orders</h3>
                <div className="card-list">
                    {(data.recent_orders || []).map((o) => (
                        <Link key={o.id} to={`/admin/shop/orders/${o.id}`} className="order-card">
                            <div>
                                <strong>{o.order_number}</strong>
                                <p className="text-muted">{o.user?.name}</p>
                            </div>
                            <div className="order-card-right">
                                <span className={`badge badge-${o.status}`}>{o.status}</span>
                                <strong>₹{o.grand_total}</strong>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
