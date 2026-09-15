import { useEffect, useState } from 'react';
import api from '../../../api/client';
import Alert from '../../../components/Alert';
import LoaderScreen from '../../../components/LoaderScreen';

export default function AdminCommerceOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);

    const load = () => {
        api.get('/admin/commerce/orders')
            .then((res) => setOrders(res.data.data || []))
            .catch((err) => setError(err.response?.data?.message || 'Failed'))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const transition = async (id, status) => {
        try {
            await api.post(`/admin/commerce/orders/${id}/status`, { status });
            load();
            if (selected?.id === id) {
                const { data } = await api.get(`/admin/commerce/orders/${id}`);
                setSelected(data.order);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Status update failed');
        }
    };

    if (loading) return <LoaderScreen message="Loading orders..." />;

    return (
        <div className="page">
            <h1 className="page-title">Commerce Orders</h1>
            {error && <Alert type="error">{error}</Alert>}
            <div className="player-list">
                {orders.map((o) => (
                    <button key={o.id} type="button" className="player-item" onClick={() => setSelected(o)}>
                        <div>
                            <strong>{o.order_number}</strong>
                            <p className="muted">{o.status} · {o.payment_method} · {o.user?.name}</p>
                        </div>
                        <strong>₹{Number(o.total_amount).toLocaleString()}</strong>
                    </button>
                ))}
            </div>

            {selected && (
                <div className="card section">
                    <h2 className="dashboard-panel-title">{selected.order_number}</h2>
                    <p>{selected.status} / {selected.payment_status}</p>
                    <div className="page-actions">
                        {['PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((s) => (
                            <button key={s} type="button" className="btn btn-secondary btn-sm" onClick={() => transition(selected.id, s)}>{s}</button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
