import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../api/client';
import Alert from '../../../components/Alert';
import LoaderScreen from '../../../components/LoaderScreen';

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

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ marginBottom: 0 }}>Commerce</h1>
                    <p className="page-subtitle">Products, inventory, and orders</p>
                </div>
            </div>
            {error && <Alert type="error">{error}</Alert>}
            <div className="status-stats">
                {[
                    ['Products', stats.products],
                    ['Active', stats.active_products],
                    ['Orders', stats.orders],
                    ['To ship', stats.orders_to_ship],
                    ['Low stock', stats.low_stock_variants],
                    ['Returns', stats.return_requests],
                ].map(([label, value]) => (
                    <div key={label} className="status-stat">
                        <strong>{value ?? 0}</strong>
                        <span>{label}</span>
                    </div>
                ))}
            </div>
            <div className="quick-actions">
                <button type="button" className="quick-action" onClick={() => navigate('/admin/commerce/products')}><span className="quick-action-icon">📦</span><span className="quick-action-label">Products</span></button>
                <button type="button" className="quick-action" onClick={() => navigate('/admin/commerce/orders')}><span className="quick-action-icon">🧾</span><span className="quick-action-label">Orders</span></button>
                <button type="button" className="quick-action" onClick={() => navigate('/admin/commerce/inventory')}><span className="quick-action-icon">📊</span><span className="quick-action-label">Inventory</span></button>
                <button type="button" className="quick-action" onClick={() => navigate('/admin/commerce/settings')}><span className="quick-action-icon">⚙️</span><span className="quick-action-label">Settings</span></button>
            </div>
            <p style={{ marginTop: 16 }}><Link to="/admin">← Back to admin</Link></p>
        </div>
    );
}
