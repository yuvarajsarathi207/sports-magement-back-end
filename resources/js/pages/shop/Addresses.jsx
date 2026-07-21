import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import LoaderScreen from '../../components/LoaderScreen';

export default function Addresses() {
    const navigate = useNavigate();
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = () => {
        api.get('/shop/addresses')
            .then((res) => setAddresses(res.data))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    if (loading) return <LoaderScreen message="Loading addresses..." />;

    return (
        <div className="page">
            <div className="section-header">
                <h2 className="section-title">Addresses</h2>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/checkout')}>Add via checkout</button>
            </div>
            <div className="card-list">
                {addresses.map((a) => (
                    <div key={a.id} className="address-option">
                        <div>
                            <strong>{a.full_name}</strong> {a.is_default && <span className="badge badge-info">Default</span>}
                            <p className="text-muted">
                                {[a.house_number, a.street, a.area, a.city, a.state, a.postal_code].filter(Boolean).join(', ')}
                            </p>
                            <div className="btn-row">
                                {!a.is_default && (
                                    <button type="button" className="btn-link" onClick={async () => {
                                        await api.post(`/shop/addresses/${a.id}/default`);
                                        load();
                                    }}>Set default</button>
                                )}
                                <button type="button" className="btn-link danger" onClick={async () => {
                                    await api.delete(`/shop/addresses/${a.id}`);
                                    load();
                                }}>Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
