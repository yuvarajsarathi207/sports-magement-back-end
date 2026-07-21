import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';
import LoaderScreen from '../../../components/LoaderScreen';

export default function Orders() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        api.get('/shop/orders')
            .then((res) => setOrders(res.data.data || []))
            .finally(() => setLoading(false));
    }, [user]);

    if (!user) {
        return (
            <div className="page empty-state">
                <p>Login to view orders.</p>
                <button className="btn btn-primary" onClick={() => navigate('/login')}>Login</button>
            </div>
        );
    }

    if (loading) return <LoaderScreen message="Loading orders..." />;

    return (
        <div className="page">
            <h2 className="section-title">My Orders</h2>
            {orders.length === 0 ? (
                <div className="empty-state"><p>No orders yet.</p></div>
            ) : (
                <div className="card-list">
                    {orders.map((o) => (
                        <button key={o.id} type="button" className="order-card" onClick={() => navigate(`/orders/${o.id}`)}>
                            <div>
                                <strong>{o.order_number}</strong>
                                <p className="text-muted">{new Date(o.created_at).toLocaleString()}</p>
                            </div>
                            <div className="order-card-right">
                                <span className={`badge badge-${o.status}`}>{o.status}</span>
                                <strong>₹{o.grand_total}</strong>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
