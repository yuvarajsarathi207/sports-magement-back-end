import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/client';
import Alert from '../../../components/Alert';
import LoaderScreen from '../../../components/LoaderScreen';
import StatusStats from '../../../components/StatusStats';

function formatMoney(amount) {
    return Number(amount || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
}

function variantLabel(variant) {
    const parts = [variant.product?.name || variant.name || 'Variant'];
    if (variant.sku) parts.push(variant.sku);
    const attrs = [variant.size, variant.color].filter(Boolean).join(' / ');
    if (attrs) parts.push(attrs);
    return parts.join(' · ');
}

export default function AdminCommerceDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/admin/commerce/dashboard')
            .then((res) => setData(res.data))
            .catch((err) => setError(err.response?.data?.message || 'Failed to load'));
    }, []);

    if (!data && !error) return <LoaderScreen message="Loading commerce..." />;

    const stats = data?.stats || {};
    const ordersToShip = data?.orders_to_ship || [];
    const lowStockVariants = data?.low_stock_variants || [];

    const statusItems = [
        { value: stats.orders_to_ship || 0, label: 'To ship', icon: '📦', tone: 'warning' },
        { value: stats.low_stock_variants || 0, label: 'Low stock', icon: '📉', tone: 'danger' },
        { value: stats.return_requests || 0, label: 'Returns', icon: '↩️', tone: 'warning' },
        { value: stats.orders || 0, label: 'Orders', icon: '🧾', tone: 'info' },
        { value: stats.active_products || 0, label: 'Active', icon: '✅', tone: 'success' },
    ];

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-header-text">
                    <h1 className="page-title" style={{ marginBottom: 0 }}>Shop Dashboard</h1>
                    <p className="page-subtitle">Orders to ship and inventory that needs attention.</p>
                </div>
                <div className="page-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/admin/commerce/orders')}>
                        Orders
                    </button>
                </div>
            </div>

            {error && <Alert type="error">{error}</Alert>}

            <StatusStats items={statusItems} />

            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">Orders to ship</h2>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/admin/commerce/orders')}>
                        View all
                    </button>
                </div>
                {ordersToShip.length === 0 ? (
                    <div className="empty-state"><p>No orders waiting to ship.</p></div>
                ) : (
                    <ul className="player-list">
                        {ordersToShip.map((order) => (
                            <li
                                key={order.id}
                                className="player-item"
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate('/admin/commerce/orders')}
                            >
                                <span className="avatar sm">#</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <strong>{order.order_number || `Order #${order.id}`}</strong>
                                    <p className="text-muted">{order.user?.name || 'Customer'}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <strong>₹{formatMoney(order.total_amount)}</strong>
                                    <div>
                                        <span className="badge badge-warning">{order.status}</span>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">Low stock</h2>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/admin/commerce/inventory')}>
                        View all
                    </button>
                </div>
                {lowStockVariants.length === 0 ? (
                    <div className="empty-state"><p>No low-stock variants.</p></div>
                ) : (
                    <ul className="player-list">
                        {lowStockVariants.map((variant) => (
                            <li
                                key={variant.id}
                                className="player-item"
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate('/admin/commerce/inventory')}
                            >
                                <span className="avatar sm">📦</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <strong>{variantLabel(variant)}</strong>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <strong>{variant.available_quantity ?? 0}</strong>
                                    <p className="text-muted" style={{ fontSize: 12, margin: 0 }}>available</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
