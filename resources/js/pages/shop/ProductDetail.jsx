import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import Alert from '../../components/Alert';
import LoaderScreen from '../../components/LoaderScreen';

export default function ShopProductDetail({ basePath = '/shop' }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [variantId, setVariantId] = useState(null);
    const [qty, setQty] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        setLoading(true);
        api.get(`/commerce/products/${id}`)
            .then((res) => {
                setProduct(res.data.product);
                const first = res.data.product?.variants?.find((v) => v.status === 'active') || res.data.product?.variants?.[0];
                setVariantId(first?.id || null);
            })
            .catch((err) => setError(err.response?.data?.message || 'Product not found'))
            .finally(() => setLoading(false));
    }, [id]);

    const variant = useMemo(
        () => product?.variants?.find((v) => v.id === variantId),
        [product, variantId]
    );

    const price = variant
        ? (Number(variant.discount_price) > 0 ? variant.discount_price : variant.price)
        : 0;

    const addToCart = async () => {
        if (!variantId) return;
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            await api.post('/commerce/cart/items', { product_variant_id: variantId, quantity: qty });
            setSuccess('Added to cart');
        } catch (err) {
            setError(err.response?.data?.message || 'Could not add to cart');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoaderScreen message="Loading product..." />;
    if (!product) return <Alert type="error">{error || 'Not found'}</Alert>;

    const image = product.images?.find((i) => i.is_primary)?.url || product.images?.[0]?.url;

    return (
        <div className="page">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(basePath)}>← Back to shop</button>
            <div className="product-detail">
                <div className="product-detail-media">
                    {image ? <img src={image} alt={product.name} /> : <div className="product-card-placeholder">🛒</div>}
                </div>
                <div className="product-detail-info">
                    <p className="product-card-brand">{product.brand?.name || product.category?.name}</p>
                    <h1 className="page-title">{product.name}</h1>
                    <p className="page-subtitle">{product.description}</p>
                    <p className="product-detail-price">₹{Number(price).toLocaleString()}</p>

                    {product.variants?.length > 1 && (
                        <div className="field-group">
                            <label className="field-label">Variant</label>
                            <select className="field" value={variantId || ''} onChange={(e) => setVariantId(Number(e.target.value))}>
                                {product.variants.map((v) => (
                                    <option key={v.id} value={v.id}>
                                        {[v.size, v.color, v.sku].filter(Boolean).join(' / ') || v.name || v.sku}
                                        {` — stock ${v.available_quantity}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="field-group">
                        <label className="field-label">Quantity</label>
                        <input className="field" type="number" min={1} max={99} value={qty} onChange={(e) => setQty(Number(e.target.value) || 1)} />
                    </div>

                    {error && <Alert type="error">{error}</Alert>}
                    {success && <Alert type="success">{success}</Alert>}

                    <div className="page-actions" style={{ marginTop: 12 }}>
                        <button type="button" className="btn btn-primary" disabled={saving || !variantId} onClick={addToCart}>
                            {saving ? 'Adding...' : 'Add to cart'}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate(`${basePath}/cart`)}>Go to cart</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
