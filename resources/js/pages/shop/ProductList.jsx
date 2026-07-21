import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import ProductCard from '../../components/shop/ProductCard';
import LoaderScreen from '../../components/LoaderScreen';

export default function ProductList() {
    const [params, setParams] = useSearchParams();
    const navigate = useNavigate();
    const [data, setData] = useState({ data: [] });
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState(params.get('sort') || 'latest');

    useEffect(() => {
        setLoading(true);
        const query = Object.fromEntries(params.entries());
        query.sort = sort;
        api.get('/shop/products', { params: query })
            .then((res) => setData(res.data))
            .finally(() => setLoading(false));
    }, [params, sort]);

    return (
        <div className="page">
            <div className="section-header">
                <h2 className="section-title">Products</h2>
                <select className="select-sm" value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="latest">Latest</option>
                    <option value="price_asc">Price ↑</option>
                    <option value="price_desc">Price ↓</option>
                    <option value="rating">Rating</option>
                    <option value="name">Name</option>
                </select>
            </div>

            {loading ? (
                <LoaderScreen message="Loading products..." />
            ) : data.data?.length === 0 ? (
                <div className="empty-state"><p>No products found.</p></div>
            ) : (
                <div className="product-grid">
                    {data.data.map((p) => (
                        <ProductCard key={p.id} product={p} onClick={() => navigate(`/shop/products/${p.id}`)} />
                    ))}
                </div>
            )}
        </div>
    );
}
