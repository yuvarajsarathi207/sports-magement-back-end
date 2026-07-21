import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import LoaderScreen from '../../components/LoaderScreen';

export default function Cart() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = () => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        api.get('/shop/cart')
            .then((res) => setCart(res.data))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, [user]);

    if (!user) {
        return (
            <div className="page empty-state">
                <p>Login to view your cart.</p>
                <button className="btn btn-primary" onClick={() => navigate('/login')}>Login</button>
            </div>
        );
    }

    if (loading || !cart) return <LoaderScreen message="Loading cart..." />;

    const summary = cart.summary;

    const updateQty = async (id, quantity) => {
        const { data } = await api.put(`/shop/cart/${id}`, { quantity });
        setCart(data);
    };

    const remove = async (id) => {
        const { data } = await api.delete(`/shop/cart/${id}`);
        setCart(data);
    };

    const saveLater = async (id) => {
        const { data } = await api.post(`/shop/cart/${id}/save-for-later`);
        setCart(data);
    };

    return (
        <div className="page">
            <h2 className="section-title">Cart ({summary.item_count})</h2>

            {summary.items.length === 0 ? (
                <div className="empty-state">
                    <p>Your cart is empty.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/shop/products')}>Shop now</button>
                </div>
            ) : (
                <>
                    <div className="card-list">
                        {summary.items.map((item) => (
                            <div key={item.id} className="cart-item">
                                {item.image && <img src={item.image} alt="" className="cart-item-img" />}
                                <div className="cart-item-body">
                                    <strong>{item.name}</strong>
                                    <p>₹{item.effective_price} × {item.quantity}</p>
                                    <div className="qty-row">
                                        <button type="button" className="btn btn-outline btn-sm" onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))}>-</button>
                                        <span>{item.quantity}</span>
                                        <button type="button" className="btn btn-outline btn-sm" onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                                        <button type="button" className="btn-link" onClick={() => saveLater(item.id)}>Save</button>
                                        <button type="button" className="btn-link danger" onClick={() => remove(item.id)}>Remove</button>
                                    </div>
                                </div>
                                <strong>₹{item.line_total}</strong>
                            </div>
                        ))}
                    </div>

                    <div className="summary-card">
                        <div className="summary-row"><span>Product total</span><span>₹{summary.product_total}</span></div>
                        <div className="summary-row"><span>Discount</span><span>-₹{summary.discount}</span></div>
                        <div className="summary-row"><span>Tax</span><span>₹{summary.tax}</span></div>
                        <div className="summary-row"><span>Shipping</span><span>₹{summary.shipping}</span></div>
                        <div className="summary-row total"><span>Grand total</span><span>₹{summary.grand_total}</span></div>
                    </div>

                    <button className="btn btn-primary btn-block" onClick={() => navigate('/checkout')}>
                        Checkout
                    </button>
                </>
            )}

            {cart.saved_for_later?.length > 0 && (
                <section className="section">
                    <h3 className="section-title">Saved for later</h3>
                    {cart.saved_for_later.map((item) => (
                        <div key={item.id} className="cart-item">
                            <div className="cart-item-body">
                                <strong>{item.product?.name}</strong>
                                <button type="button" className="btn btn-outline btn-sm" onClick={async () => {
                                    const { data } = await api.post(`/shop/cart/${item.id}/move-to-cart`);
                                    setCart(data);
                                }}>Move to cart</button>
                            </div>
                        </div>
                    ))}
                </section>
            )}
        </div>
    );
}
