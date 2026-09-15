import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import Alert from '../../components/Alert';
import LoaderScreen from '../../components/LoaderScreen';
import { INDIAN_STATES } from '../../data/indianStates';

export default function ShopCheckout({ basePath = '/shop' }) {
    const navigate = useNavigate();
    const [quote, setQuote] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [addressId, setAddressId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [couponCode, setCouponCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showNewAddress, setShowNewAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({
        name: '', mobile: '', address_line1: '', address_line2: '', city: '', state: '', pincode: '', address_type: 'HOME', is_default: true,
    });

    const refresh = async (method = paymentMethod, coupon = couponCode) => {
        const [q, a] = await Promise.all([
            api.post('/commerce/checkout/validate', { payment_method: method || undefined, coupon_code: coupon || undefined }),
            api.get('/commerce/addresses'),
        ]);
        setQuote(q.data);
        setAddresses(a.data.addresses || []);
        if (!addressId && a.data.addresses?.[0]) {
            setAddressId(String(a.data.addresses[0].id));
        }
        const eligible = (q.data.payment_methods || []).filter((m) => m.eligible);
        if (eligible.length && !eligible.find((m) => m.id === method)) {
            setPaymentMethod(eligible[0].id);
        }
    };

    useEffect(() => {
        refresh()
            .catch((err) => setError(err.response?.data?.message || 'Checkout unavailable'))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const saveAddress = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const { data } = await api.post('/commerce/addresses', newAddress);
            setAddresses((prev) => [data.address, ...prev]);
            setAddressId(String(data.address.id));
            setShowNewAddress(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not save address');
        }
    };

    const placeOrder = async () => {
        setSubmitting(true);
        setError('');
        try {
            const { data } = await api.post('/commerce/checkout', {
                shipping_address_id: Number(addressId),
                payment_method: paymentMethod,
                coupon_code: couponCode || undefined,
                idempotency_key: `web-${Date.now()}`,
            });

            const payment = data.payment;
            if (payment?.requires_payment && payment?.redirect_url) {
                window.location.href = payment.redirect_url;
                return;
            }

            navigate(`${basePath}/orders/${data.order.id}?success=1`);
        } catch (err) {
            setError(err.response?.data?.message || 'Checkout failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoaderScreen message="Preparing checkout..." />;

    return (
        <div className="page checkout-page">
            <h1 className="page-title">Checkout</h1>
            {error && <Alert type="error">{error}</Alert>}

            <section className="card section">
                <h2 className="dashboard-panel-title">Delivery address</h2>
                {addresses.map((a) => (
                    <label key={a.id} className="radio-row">
                        <input type="radio" name="address" checked={String(addressId) === String(a.id)} onChange={() => setAddressId(String(a.id))} />
                        <span>
                            <strong>{a.name}</strong> · {a.mobile}<br />
                            {a.address_line1}, {a.city}, {a.state} {a.pincode}
                        </span>
                    </label>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowNewAddress((v) => !v)}>
                    {showNewAddress ? 'Cancel' : 'Add address'}
                </button>
                {showNewAddress && (
                    <form className="stack-form" onSubmit={saveAddress} style={{ marginTop: 12 }}>
                        <input className="field" required placeholder="Name" value={newAddress.name} onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })} />
                        <input className="field" required placeholder="Mobile" value={newAddress.mobile} onChange={(e) => setNewAddress({ ...newAddress, mobile: e.target.value })} />
                        <input className="field" required placeholder="Address line 1" value={newAddress.address_line1} onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })} />
                        <input className="field" placeholder="Address line 2" value={newAddress.address_line2} onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })} />
                        <input className="field" required placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
                        <select className="field" required value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}>
                            <option value="">State</option>
                            {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <input className="field" required placeholder="Pincode" value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} />
                        <button type="submit" className="btn btn-primary">Save address</button>
                    </form>
                )}
            </section>

            <section className="card section">
                <h2 className="dashboard-panel-title">Payment</h2>
                {(quote?.payment_methods || []).map((m) => (
                    <label key={m.id} className={`radio-row${!m.eligible ? ' disabled' : ''}`}>
                        <input
                            type="radio"
                            name="pay"
                            disabled={!m.eligible}
                            checked={paymentMethod === m.id}
                            onChange={() => {
                                setPaymentMethod(m.id);
                                refresh(m.id, couponCode).catch(() => {});
                            }}
                        />
                        <span>{m.label}{!m.eligible ? ' (not available)' : ''}</span>
                    </label>
                ))}
            </section>

            <section className="card section">
                <h2 className="dashboard-panel-title">Coupon</h2>
                <div className="shop-search">
                    <input className="field" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Coupon code" />
                    <button type="button" className="btn btn-secondary" onClick={() => refresh(paymentMethod, couponCode).catch((err) => setError(err.response?.data?.message || 'Invalid coupon'))}>Apply</button>
                </div>
            </section>

            <section className="card section">
                <h2 className="dashboard-panel-title">Order summary</h2>
                {(quote?.items || []).map((item, idx) => (
                    <div key={idx} className="summary-row">
                        <span>{item.product_name} × {item.quantity}</span>
                        <span>₹{Number(item.line_total).toLocaleString()}</span>
                    </div>
                ))}
                <div className="summary-row"><span>Subtotal</span><span>₹{Number(quote?.subtotal || 0).toLocaleString()}</span></div>
                <div className="summary-row"><span>Tax</span><span>₹{Number(quote?.tax_amount || 0).toLocaleString()}</span></div>
                <div className="summary-row"><span>Coupon</span><span>-₹{Number(quote?.coupon_discount || 0).toLocaleString()}</span></div>
                <div className="summary-row"><span>Delivery</span><span>₹{Number(quote?.delivery_charge || 0).toLocaleString()}</span></div>
                <div className="summary-row total"><span>Total</span><span>₹{Number(quote?.total_amount || 0).toLocaleString()}</span></div>
                <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} disabled={submitting || !addressId} onClick={placeOrder}>
                    {submitting ? 'Placing order...' : 'Place order'}
                </button>
            </section>
        </div>
    );
}
