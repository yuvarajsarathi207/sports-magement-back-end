import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../../api/client';
import LoaderScreen from '../../../components/LoaderScreen';

export default function AdminOrders() {
    const { id } = useParams();
    const [orders, setOrders] = useState([]);
    const [order, setOrder] = useState(null);
    const [status, setStatus] = useState('confirmed');

    useEffect(() => {
        if (id) {
            api.get(`/admin/shop/orders/${id}`).then((res) => {
                setOrder(res.data);
                setStatus(res.data.status);
            });
        } else {
            api.get('/admin/shop/orders').then((res) => setOrders(res.data.data || []));
        }
    }, [id]);

    if (id) {
        if (!order) return <LoaderScreen />;
        return (
            <div className="page">
                <Link to="/admin/shop/orders" className="btn-link">← Orders</Link>
                <h2 className="section-title">{order.order_number}</h2>
                <p>{order.user?.name} · {order.user?.email}</p>
                <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                    {['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
                <div className="btn-row">
                    <button type="button" className="btn btn-primary" onClick={async () => {
                        const { data } = await api.put(`/admin/shop/orders/${id}/status`, { status });
                        setOrder(data);
                    }}>Update status</button>
                    <button type="button" className="btn btn-outline" onClick={async () => {
                        const { data } = await api.post(`/admin/shop/orders/${id}/refund`);
                        setOrder(data);
                    }}>Refund</button>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <h2 className="section-title">Shop Orders</h2>
            <div className="card-list">
                {orders.map((o) => (
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
        </div>
    );
}
