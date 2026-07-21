import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import ProductCard from '../../components/shop/ProductCard';
import LoaderScreen from '../../components/LoaderScreen';

export default function ProductDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [qty, setQty] = useState(1);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        api.get(`/shop/products/${id}`).then((res) => setData(res.data));
    }, [id]);

    if (!data) return <LoaderScreen message="Loading product..." />;

    const product = data.product;
    const price = product.effective_price ?? product.price;

    const requireAuth = (fn) => {
        if (!user) {
            navigate('/login', { state: { from: `/shop/products/${id}` } });
            return;
        }
        fn();
    };

    const addToCart = () => requireAuth(async () => {
        setBusy(true);
        setMsg('');
        try {
            await api.post('/shop/cart', { product_id: product.id, quantity: qty });
            setMsg('Added to cart');
        } catch (e) {
            setMsg(e.response?.data?.message || 'Could not add to cart');
        } finally {
            setBusy(false);
        }
    });

    const addWishlist = () => requireAuth(async () => {
        try {
            await api.post('/shop/wishlist', { product_id: product.id });
            setMsg('Saved to wishlist');
        } catch (e) {
            setMsg(e.response?.data?.message || 'Could not save');
        }
    });

    return (
        <div className="page product-detail">
            <div className="product-gallery">
                {(product.images?.length ? product.images : [{ url: product.primary_image_url }]).map((img, i) => (
                    <img key={i} src={img.url || img.path} alt={product.name} />
                ))}
            </div>

            <div className="product-detail-body">
                <p className="text-muted">{product.brand} · {product.category?.name}</p>
                <h1 className="page-title">{product.name}</h1>
                <div className="product-card-price-row">
                    <span className="price lg">₹{Number(price).toLocaleString()}</span>
                    {Number(price) < Number(product.price) && (
                        <span className="price-strike">₹{Number(product.price).toLocaleString()}</span>
                    )}
                </div>
                {product.rating > 0 && <p>★ {Number(product.rating).toFixed(1)} ({product.rating_count})</p>}
                <p className="product-desc">{product.description}</p>
                <p className="text-muted">SKU: {product.sku} · Stock: {product.stock}</p>

                <div className="qty-row">
                    <button type="button" className="btn btn-outline" onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
                    <span>{qty}</span>
                    <button type="button" className="btn btn-outline" onClick={() => setQty((q) => q + 1)}>+</button>
                </div>

                {msg && <p className="form-success">{msg}</p>}

                <div className="btn-row">
                    <button type="button" className="btn btn-primary" disabled={busy || product.stock < 1} onClick={addToCart}>
                        Add to Cart
                    </button>
                    <button type="button" className="btn btn-outline" onClick={addWishlist}>♡ Wishlist</button>
                </div>
            </div>

            {data.related_products?.length > 0 && (
                <section className="section">
                    <h2 className="section-title">Related</h2>
                    <div className="product-rail">
                        {data.related_products.map((p) => (
                            <ProductCard key={p.id} product={p} onClick={() => navigate(`/shop/products/${p.id}`)} />
                        ))}
                    </div>
                </section>
            )}

            {data.similar_products?.length > 0 && (
                <section className="section">
                    <h2 className="section-title">Similar</h2>
                    <div className="product-rail">
                        {data.similar_products.map((p) => (
                            <ProductCard key={p.id} product={p} onClick={() => navigate(`/shop/products/${p.id}`)} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
