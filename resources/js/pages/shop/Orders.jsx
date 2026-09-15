import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import Alert from '../../components/Alert';
import LoaderScreen from '../../components/LoaderScreen';

export function ShopOrders({ basePath = '/shop' }) {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/commerce/orders')
            .then((res) => setOrders(res.data.data || []))
            .catch((err) => setError(err.response?.data?.message || 'Could not load orders'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoaderScreen message="Loading orders..." />;

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title" style={{ marginBottom: 0 }}>My Orders</h1>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(basePath)}>Shop</button>
            </div>
            {error && <Alert type="error">{error}</Alert>}
            {!orders.length ? <div className="empty-state">No orders yet.</div> : (
                <div className="player-list">
                    {orders.map((o) => (
                        <button key={o.id} type="button" className="player-item" onClick={() => navigate(`${basePath}/orders/${o.id}`)}>
                            <div>
                                <strong>{o.order_number}</strong>
                                <p className="muted">{o.status} · {o.payment_status}</p>
                            </div>
                            <strong>₹{Number(o.total_amount).toLocaleString()}</strong>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export function ShopOrderDetail({ basePath = '/shop' }) {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState(searchParams.get('success') ? 'Order placed successfully.' : '');

    const load = () => {
        api.get(`/commerce/orders/${id}`)
            .then((res) => setOrder(res.data.order))
            .catch((err) => setError(err.response?.data?.message || 'Order not found'))
            .finally(() => setLoading(false));
    };

    useEffect(load, [id]);

    const cancel = async () => {
        try {
            const { data } = await api.post(`/commerce/orders/${id}/cancel`, { reason: 'Cancelled by user' });
            setOrder(data.order);
            setMessage('Order cancelled.');
        } catch (err) {
            setError(err.response?.data?.message || 'Cancel failed');
        }
    };

    const requestReturn = async () => {
        try {
            const { data } = await api.post(`/commerce/orders/${id}/return`, { reason: 'Return requested' });
            setOrder(data.order);
            setMessage('Return requested.');
        } catch (err) {
            setError(err.response?.data?.message || 'Return failed');
        }
    };

    if (loading) return <LoaderScreen message="Loading order..." />;
    if (!order) return <Alert type="error">{error || 'Not found'}</Alert>;

    return (
        <div className="page">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(`${basePath}/orders`)}>← Orders</button>
            <h1 className="page-title">{order.order_number}</h1>
            <p className="page-subtitle">{order.status} · Payment {order.payment_status}</p>
            {message && <Alert type="success">{message}</Alert>}
            {error && <Alert type="error">{error}</Alert>}

            <div className="card section">
                {(order.items || []).map((item) => (
                    <div key={item.id} className="summary-row">
                        <span>{item.product_name} ({item.sku}) × {item.quantity}</span>
                        <span>₹{Number(item.line_total).toLocaleString()}</span>
                    </div>
                ))}
                <div className="summary-row total"><span>Total</span><span>₹{Number(order.total_amount).toLocaleString()}</span></div>
            </div>

            {order.shipping_address && (
                <div className="card section">
                    <h2 className="dashboard-panel-title">Shipping</h2>
                    <p>{order.shipping_address.name}, {order.shipping_address.mobile}</p>
                    <p>{order.shipping_address.address_line1}, {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}</p>
                </div>
            )}

            <div className="page-actions">
                {['CREATED', 'PAYMENT_PENDING', 'CONFIRMED'].includes(order.status) && (
                    <button type="button" className="btn btn-secondary" onClick={cancel}>Cancel order</button>
                )}
                {order.status === 'DELIVERED' && (
                    <button type="button" className="btn btn-secondary" onClick={requestReturn}>Request return</button>
                )}
            </div>
        </div>
    );
}
