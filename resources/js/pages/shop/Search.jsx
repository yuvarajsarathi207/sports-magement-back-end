import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import ProductCard from '../../components/shop/ProductCard';
import LoaderScreen from '../../components/LoaderScreen';

export default function Search() {
    const [q, setQ] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const search = async (e) => {
        e?.preventDefault();
        if (!q.trim()) return;
        setLoading(true);
        try {
            const { data } = await api.get('/shop/products', { params: { q: q.trim() } });
            setResults(data.data || []);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <form className="search-form" onSubmit={search}>
                <input
                    className="input"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search products..."
                    autoFocus
                />
                <button type="submit" className="btn btn-primary">Search</button>
            </form>
            {loading ? (
                <LoaderScreen message="Searching..." />
            ) : (
                <div className="product-grid" style={{ marginTop: 16 }}>
                    {results.map((p) => (
                        <ProductCard key={p.id} product={p} onClick={() => navigate(`/shop/products/${p.id}`)} />
                    ))}
                </div>
            )}
        </div>
    );
}
