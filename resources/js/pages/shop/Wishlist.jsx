import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import ProductCard from '../../components/shop/ProductCard';
import LoaderScreen from '../../components/LoaderScreen';

export default function Wishlist() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const load = () => {
        api.get('/shop/wishlist')
            .then((res) => setItems(res.data))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    if (loading) return <LoaderScreen message="Loading wishlist..." />;

    return (
        <div className="page">
            <h2 className="section-title">Wishlist</h2>
            {items.length === 0 ? (
                <div className="empty-state"><p>No saved items.</p></div>
            ) : (
                <div className="product-grid">
                    {items.map((w) => (
                        <div key={w.id} className="wishlist-item">
                            <ProductCard product={w.product} onClick={() => navigate(`/shop/products/${w.product_id}`)} />
                            <div className="btn-row">
                                <button type="button" className="btn btn-primary btn-sm" onClick={async () => {
                                    await api.post(`/shop/wishlist/${w.id}/move-to-cart`);
                                    load();
                                }}>Move to cart</button>
                                <button type="button" className="btn btn-outline btn-sm" onClick={async () => {
                                    await api.delete(`/shop/wishlist/${w.id}`);
                                    load();
                                }}>Remove</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
