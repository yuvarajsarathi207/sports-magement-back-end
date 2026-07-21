import { useNavigate, useParams } from 'react-router-dom';

export default function OrderSuccess() {
    const { id } = useParams();
    const navigate = useNavigate();

    return (
        <div className="page empty-state">
            <div style={{ fontSize: 48 }}>✅</div>
            <h2>Order placed!</h2>
            <p className="text-muted">Your order has been created successfully.</p>
            <div className="btn-row" style={{ justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={() => navigate(`/orders/${id}`)}>View order</button>
                <button className="btn btn-outline" onClick={() => navigate('/')}>Continue shopping</button>
            </div>
        </div>
    );
}
