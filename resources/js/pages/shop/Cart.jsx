import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import Alert from '../../components/Alert';
import LoaderScreen from '../../components/LoaderScreen';

export default function ShopCart({ basePath = '/shop' }) {
    const navigate = useNavigate();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = () => {
        setLoading(true);
        api.get('/commerce/cart')
            .then((res) => setCart(res.data))
            .catch((err) => setError(err.response?.data?.message || 'Could not load cart'))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const updateQty = async (id, quantity) => {
        try {
            const { data } = await api.put(`/commerce/cart/items/${id}`, { quantity });
            setCart(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Update failed');
        }
    };

    const removeItem = async (id) => {
        try {
            const { data } = await api.delete(`/commerce/cart/items/${id}`);
            setCart(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Remove failed');
        }
    };

    if (loading) return <LoaderScreen message="Loading cart..." />;

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-header-text">
                    <h1 className="page-title" style={{ marginBottom: 0 }}>Cart</h1>
                    <p className="page-subtitle">{cart?.item_count || 0} items</p>
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(basePath)}>Continue shopping</button>
            </div>

            {error && <Alert type="error">{error}</Alert>}
            {(cart?.issues || []).map((issue) => (
                <Alert key={issue.cart_item_id} type="error">{issue.message}</Alert>
            ))}

            {!cart?.items?.length ? (
                <div className="empty-state">Your cart is empty.</div>
            ) : (
                <>
                    <div className="cart-list">
                        {cart.items.map((item) => (
                            <div key={item.id} className={`cart-item${!item.valid ? ' invalid' : ''}`}>
                                <div>
                                    <strong>{item.product_name}</strong>
                                    <p className="muted">{item.variant_name} · {item.sku}</p>
                                    <p>₹{Number(item.current_unit_price).toLocaleString()} × </p>
                                    <input
                                        className="field field-sm"
                                        type="number"
                                        min={0}
                                        max={99}
                                        value={item.quantity}
                                        onChange={(e) => updateQty(item.id, Number(e.target.value))}
                                        style={{ width: 72 }}
                                    />
                                </div>
                                <div className="cart-item-actions">
                                    <strong>₹{Number(item.line_total).toLocaleString()}</strong>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeItem(item.id)}>Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="cart-summary">
                        <p>Subtotal <strong>₹{Number(cart.subtotal).toLocaleString()}</strong></p>
                        <button
                            type="button"
                            className="btn btn-primary"
                            disabled={(cart.issues || []).length > 0}
                            onClick={() => navigate(`${basePath}/checkout`)}
                        >
                            Checkout
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
