import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import ProductCard from '../../components/shop/ProductCard';
import LoaderScreen from '../../components/LoaderScreen';
import Alert from '../../components/Alert';

export default function ShopProducts({ basePath = '/shop' }) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [q, setQ] = useState(searchParams.get('q') || '');
    const categoryId = searchParams.get('category_id') || '';

    useEffect(() => {
        api.get('/commerce/categories').then((res) => setCategories(res.data.categories || [])).catch(() => {});
    }, []);

    useEffect(() => {
        setLoading(true);
        setError('');
        const params = {};
        if (categoryId) params.category_id = categoryId;
        if (searchParams.get('q')) params.q = searchParams.get('q');
        api.get('/commerce/products', { params })
            .then((res) => setProducts(res.data.data || res.data || []))
            .catch((err) => setError(err.response?.data?.message || 'Could not load products'))
            .finally(() => setLoading(false));
    }, [categoryId, searchParams]);

    const onSearch = (e) => {
        e.preventDefault();
        const next = new URLSearchParams(searchParams);
        if (q.trim()) next.set('q', q.trim());
        else next.delete('q');
        setSearchParams(next);
    };

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-header-text">
                    <h1 className="page-title" style={{ marginBottom: 0 }}>Shop</h1>
                    <p className="page-subtitle">Sports gear recommended for your game.</p>
                </div>
                <div className="page-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(`${basePath}/cart`)}>Cart</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(`${basePath}/orders`)}>Orders</button>
                </div>
            </div>

            <form className="shop-search" onSubmit={onSearch}>
                <input className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." />
                <button type="submit" className="btn btn-primary">Search</button>
            </form>

            <div className="category-pills" style={{ marginBottom: 16 }}>
                <button
                    type="button"
                    className={`category-pill${!categoryId ? ' active' : ''}`}
                    onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        next.delete('category_id');
                        setSearchParams(next);
                    }}
                >
                    All
                </button>
                {categories.map((c) => (
                    <button
                        key={c.id}
                        type="button"
                        className={`category-pill${String(categoryId) === String(c.id) ? ' active' : ''}`}
                        onClick={() => {
                            const next = new URLSearchParams(searchParams);
                            next.set('category_id', c.id);
                            setSearchParams(next);
                        }}
                    >
                        {c.name}
                    </button>
                ))}
            </div>

            {error && <Alert type="error">{error}</Alert>}
            {loading ? <LoaderScreen message="Loading products..." /> : (
                products.length === 0 ? (
                    <div className="empty-state">No products found.</div>
                ) : (
                    <div className="product-grid">
                        {products.map((p) => <ProductCard key={p.id} product={p} basePath={basePath} />)}
                    </div>
                )
            )}
        </div>
    );
}
