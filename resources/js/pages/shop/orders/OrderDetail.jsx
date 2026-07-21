import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../api/client';
import LoaderScreen from '../../../components/LoaderScreen';

export default function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [track, setTrack] = useState(null);

    const load = () => {
        api.get(`/shop/orders/${id}`).then((res) => setOrder(res.data));
        api.get(`/shop/orders/${id}/track`).then((res) => setTrack(res.data));
    };

    useEffect(() => {
        load();
    }, [id]);

    if (!order) return <LoaderScreen message="Loading order..." />;

    const cancel = async () => {
        if (!confirm('Cancel this order?')) return;
        await api.post(`/shop/orders/${id}/cancel`, { reason: 'Changed mind' });
        load();
    };

    const invoice = async () => {
        const { data } = await api.get(`/shop/orders/${id}/invoice`);
        const blob = new Blob([JSON.stringify(data.invoice, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.invoice.invoice_number}.json`;
        a.click();
    };

    return (
        <div className="page">
            <button type="button" className="btn-link" onClick={() => navigate('/orders')}>← Orders</button>
            <h2 className="section-title">{order.order_number}</h2>
            <span className={`badge badge-${order.status}`}>{order.status}</span>

            <section className="section">
                <h3 className="section-title">Items</h3>
                {order.items.map((item) => (
                    <div key={item.id} className="summary-row">
                        <span>{item.product_name} × {item.quantity}</span>
                        <span>₹{item.total}</span>
                    </div>
                ))}
            </section>

            <div className="summary-card">
                <div className="summary-row"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
                <div className="summary-row"><span>Discount</span><span>-₹{order.discount}</span></div>
                <div className="summary-row"><span>Tax</span><span>₹{order.tax}</span></div>
                <div className="summary-row"><span>Shipping</span><span>₹{order.shipping}</span></div>
                <div className="summary-row total"><span>Total</span><span>₹{order.grand_total}</span></div>
            </div>

            {track?.timeline?.length > 0 && (
                <section className="section">
                    <h3 className="section-title">Track</h3>
                    <ul className="timeline">
                        {track.timeline.map((t) => (
                            <li key={t.id}>
                                <strong>{t.status}</strong>
                                <p className="text-muted">{t.note} · {new Date(t.created_at).toLocaleString()}</p>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <div className="btn-row">
                <button type="button" className="btn btn-outline" onClick={invoice}>Invoice</button>
                {['pending', 'confirmed'].includes(order.status) && (
                    <button type="button" className="btn btn-danger" onClick={cancel}>Cancel</button>
                )}
            </div>
        </div>
    );
}
