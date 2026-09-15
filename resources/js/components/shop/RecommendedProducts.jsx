import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import ProductCard from '../shop/ProductCard';

export default function RecommendedProducts({ basePath = '/shop', title = 'Recommended for You' }) {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);

    useEffect(() => {
        api.get('/commerce/recommendations')
            .then((res) => setItems(res.data.items || []))
            .catch(() => setItems([]));
    }, []);

    if (!items.length) return null;

    return (
        <section className="section">
            <div className="page-header" style={{ marginBottom: 12 }}>
                <h2 className="dashboard-panel-title" style={{ margin: 0 }}>{title}</h2>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(basePath)}>View shop</button>
            </div>
            <div className="product-grid product-grid-compact">
                {items.slice(0, 4).map((p) => (
                    <ProductCard key={p.id} product={p} basePath={basePath} />
                ))}
            </div>
        </section>
    );
}
