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
            <div className="page-header">
                <div className="page-header-text">
                    <h1 className="page-title">Commerce Orders</h1>
                    <p className="page-subtitle">Review and update order fulfillment status.</p>
                </div>
            </div>
            {error && <Alert type="error">{error}</Alert>}

            <div className="ui-grid-2">
                <div className="ui-card">
                    <div className="ui-card-header"><h2>Orders</h2></div>
                    <div className="ui-card-body stack-list">
                        {orders.map((o) => (
                            <button
                                key={o.id}
                                type="button"
                                className={`list-card${selected?.id === o.id ? ' ui-card-accent' : ''}`}
                                onClick={() => setSelected(o)}
                                style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                            >
                                <div>
                                    <h3>{o.order_number}</h3>
                                    <p className="muted">{o.payment_method} · {o.user?.name}</p>
                                    <span className={`status-pill status-${String(o.status || '').toLowerCase()}`}>{o.status}</span>
                                </div>
                                <strong>₹{Number(o.total_amount).toLocaleString()}</strong>
                            </button>
                        ))}
                        {!orders.length && <p className="empty-state">No orders yet.</p>}
                    </div>
                </div>

                {selected && (
                    <div className="ui-card">
                        <div className="ui-card-header">
                            <h2>{selected.order_number}</h2>
                            <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>Close</button>
                        </div>
                        <div className="ui-card-body">
                            <p><strong>Status:</strong> {selected.status}</p>
                            <p><strong>Payment:</strong> {selected.payment_status} ({selected.payment_method})</p>
                            <p className="muted" style={{ marginTop: 12, marginBottom: 8 }}>Update status</p>
                            <div className="row-actions">
                                {['PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((s) => (
                                    <button key={s} type="button" className="btn btn-sm btn-secondary" onClick={() => transition(selected.id, s)}>{s}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
