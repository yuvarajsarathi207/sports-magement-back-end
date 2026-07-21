import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/client';
import LoaderScreen from '../../../components/LoaderScreen';
import FormField from '../../../components/FormField';
import Alert from '../../../components/Alert';

const ADDRESS_FIELDS = [
    { key: 'full_name', label: 'Full name', required: true },
    { key: 'mobile', label: 'Mobile', required: true },
    { key: 'house_number', label: 'House / Flat no.' },
    { key: 'street', label: 'Street' },
    { key: 'area', label: 'Area' },
    { key: 'city', label: 'City', required: true },
    { key: 'state', label: 'State', required: true },
    { key: 'postal_code', label: 'Postal code', required: true },
];

const PAYMENT_LABELS = {
    razorpay: { title: 'Razorpay', desc: 'Cards, UPI, wallets' },
    phonepe: { title: 'PhonePe', desc: 'UPI & PhonePe wallet' },
    cod: { title: 'Cash on Delivery', desc: 'Pay when you receive' },
};

export default function Checkout() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [addresses, setAddresses] = useState([]);
    const [addressId, setAddressId] = useState(null);
    const [cart, setCart] = useState(null);
    const [methods, setMethods] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('razorpay');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [newAddress, setNewAddress] = useState({
        full_name: '', mobile: '', house_number: '', street: '', area: '', city: '', state: '', postal_code: '', address_type: 'home', is_default: true,
    });

    useEffect(() => {
        Promise.all([
            api.get('/shop/addresses'),
            api.get('/shop/cart'),
            api.get('/shop/payment-methods'),
        ]).then(([a, c, m]) => {
            setAddresses(a.data);
            setAddressId(a.data.find((x) => x.is_default)?.id || a.data[0]?.id || null);
            setCart(c.data);
            setMethods(m.data.methods || []);
            setPaymentMethod(m.data.default || 'razorpay');
        });
    }, []);

    if (!cart) return <LoaderScreen message="Preparing checkout..." />;

    if (!cart.summary?.items?.length) {
        return (
            <div className="page empty-state">
                <p>Cart is empty.</p>
                <button className="btn btn-primary" onClick={() => navigate('/cart')}>Back to cart</button>
            </div>
        );
    }

    const saveAddress = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            const { data } = await api.post('/shop/addresses', newAddress);
            setAddresses((prev) => [data, ...prev]);
            setAddressId(data.id);
            setStep(2);
        } catch (err) {
            const errors = err.response?.data?.errors;
            setError(errors ? Object.values(errors).flat().join(' ') : (err.response?.data?.message || 'Could not save address'));
        } finally {
            setBusy(false);
        }
    };

    const placeOrder = async () => {
        if (!addressId) {
            setError('Select an address');
            return;
        }
        setBusy(true);
        setError('');
        try {
            const { data: order } = await api.post('/shop/orders', {
                address_id: addressId,
                payment_method: paymentMethod,
            });

            if (paymentMethod !== 'cod') {
                await api.post(`/shop/orders/${order.id}/pay/confirm`, {
                    transaction_id: order.latest_payment?.transaction_id,
                });
            }

            navigate(`/orders/${order.id}/success`);
        } catch (err) {
            setError(err.response?.data?.message || 'Checkout failed');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="page checkout-page">
            <h1 className="page-title">Checkout</h1>

            <div className="checkout-steps">
                <span className={step >= 1 ? 'active' : ''}>1. Address</span>
                <span className={step >= 2 ? 'active' : ''}>2. Review</span>
                <span className={step >= 3 ? 'active' : ''}>3. Payment</span>
            </div>

            <Alert message={error} />

            <div className="checkout-layout">
                <div className="checkout-main">
                    {step === 1 && (
                        <section className="ui-panel">
                            <h2 className="section-title">Delivery address</h2>
                            {addresses.length > 0 && (
                                <div className="address-grid">
                                    {addresses.map((a) => (
                                        <label key={a.id} className={`address-option${addressId === a.id ? ' selected' : ''}`}>
                                            <input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} />
                                            <div>
                                                <strong>{a.full_name}</strong> · {a.mobile}
                                                <p className="text-muted">
                                                    {[a.house_number, a.street, a.area, a.city, a.state, a.postal_code].filter(Boolean).join(', ')}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {addresses.length > 0 && (
                                <button type="button" className="btn btn-primary" disabled={!addressId} onClick={() => setStep(2)}>
                                    Continue with selected address
                                </button>
                            )}

                            <div className="ui-divider">
                                <span>{addresses.length ? 'Or add a new address' : 'Add a delivery address'}</span>
                            </div>

                            <form className="ui-form" onSubmit={saveAddress}>
                                <div className="form-grid-2">
                                    {ADDRESS_FIELDS.map((field) => (
                                        <FormField
                                            key={field.key}
                                            label={field.label}
                                            value={newAddress[field.key]}
                                            onChange={(e) => setNewAddress({ ...newAddress, [field.key]: e.target.value })}
                                            required={field.required}
                                        />
                                    ))}
                                </div>
                                <label className="terms-check">
                                    <input
                                        type="checkbox"
                                        checked={!!newAddress.is_default}
                                        onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                                    />
                                    <span>Set as default address</span>
                                </label>
                                <button type="submit" className="btn btn-primary" disabled={busy}>
                                    {busy ? 'Saving...' : 'Save & continue'}
                                </button>
                            </form>
                        </section>
                    )}

                    {step === 2 && (
                        <section className="ui-panel">
                            <h2 className="section-title">Review order</h2>
                            <div className="card-list single-col">
                                {cart.summary.items.map((item) => (
                                    <div key={item.id} className="cart-item">
                                        {item.image && <img src={item.image} alt="" className="cart-item-img" />}
                                        <div className="cart-item-body">
                                            <strong>{item.name}</strong>
                                            <p className="text-muted">Qty {item.quantity}</p>
                                        </div>
                                        <strong>₹{item.line_total}</strong>
                                    </div>
                                ))}
                            </div>
                            <div className="btn-row">
                                <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
                                <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>Continue to payment</button>
                            </div>
                        </section>
                    )}

                    {step === 3 && (
                        <section className="ui-panel">
                            <h2 className="section-title">Payment method</h2>
                            <div className="payment-grid">
                                {methods.map((m) => (
                                    <label key={m} className={`payment-option${paymentMethod === m ? ' selected' : ''}`}>
                                        <input type="radio" name="pay" checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} />
                                        <div>
                                            <strong>{PAYMENT_LABELS[m]?.title || m}</strong>
                                            <p className="text-muted">{PAYMENT_LABELS[m]?.desc || ''}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <p className="text-muted">Demo mode: Razorpay/PhonePe confirm instantly. COD stays pending until delivery.</p>
                            <div className="btn-row">
                                <button type="button" className="btn btn-outline" onClick={() => setStep(2)}>Back</button>
                                <button type="button" className="btn btn-primary btn-lg" disabled={busy} onClick={placeOrder}>
                                    {busy ? 'Placing order...' : `Pay ₹${cart.summary.grand_total}`}
                                </button>
                            </div>
                        </section>
                    )}
                </div>

                <aside className="checkout-aside summary-card">
                    <h3 className="section-title">Order summary</h3>
                    <div className="summary-row"><span>Product total</span><span>₹{cart.summary.product_total}</span></div>
                    <div className="summary-row"><span>Discount</span><span>-₹{cart.summary.discount}</span></div>
                    <div className="summary-row"><span>Tax</span><span>₹{cart.summary.tax}</span></div>
                    <div className="summary-row"><span>Shipping</span><span>₹{cart.summary.shipping}</span></div>
                    <div className="summary-row total"><span>Grand total</span><span>₹{cart.summary.grand_total}</span></div>
                </aside>
            </div>
        </div>
    );
}
