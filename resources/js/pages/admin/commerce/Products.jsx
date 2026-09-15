import { useEffect, useState } from 'react';
import api from '../../../api/client';
import Alert from '../../../components/Alert';
import LoaderScreen from '../../../components/LoaderScreen';

export default function AdminCommerceProducts() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [sports, setSports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [form, setForm] = useState({
        name: '', description: '', base_price: '', discount_price: '', initial_stock: 10, status: 'active', product_category_id: '', sports_category_id: '', sku: '',
    });

    const load = () => {
        setLoading(true);
        Promise.all([
            api.get('/admin/commerce/products'),
            api.get('/admin/commerce/categories'),
            api.get('/sports-categories'),
        ])
            .then(([p, c, s]) => {
                setProducts(p.data.data || []);
                setCategories(c.data.categories || []);
                setSports(s.data.categories || s.data || []);
            })
            .catch((err) => setError(err.response?.data?.message || 'Failed'))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const create = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            await api.post('/admin/commerce/products', {
                ...form,
                base_price: Number(form.base_price),
                discount_price: form.discount_price ? Number(form.discount_price) : null,
                initial_stock: Number(form.initial_stock || 0),
                product_category_id: form.product_category_id || null,
                sports_category_id: form.sports_category_id || null,
            });
            setMessage('Product created');
            setForm({ name: '', description: '', base_price: '', discount_price: '', initial_stock: 10, status: 'active', product_category_id: '', sports_category_id: '', sku: '' });
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Create failed');
        }
    };

    if (loading) return <LoaderScreen message="Loading products..." />;

    return (
        <div className="page">
            <h1 className="page-title">Commerce Products</h1>
            {error && <Alert type="error">{error}</Alert>}
            {message && <Alert type="success">{message}</Alert>}

            <form className="card section stack-form" onSubmit={create}>
                <h2 className="dashboard-panel-title">Add product</h2>
                <input className="field" required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <textarea className="field" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <input className="field" placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                <input className="field" required type="number" step="0.01" placeholder="Price" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} />
                <input className="field" type="number" step="0.01" placeholder="Discount price" value={form.discount_price} onChange={(e) => setForm({ ...form, discount_price: e.target.value })} />
                <input className="field" type="number" placeholder="Initial stock" value={form.initial_stock} onChange={(e) => setForm({ ...form, initial_stock: e.target.value })} />
                <select className="field" value={form.product_category_id} onChange={(e) => setForm({ ...form, product_category_id: e.target.value })}>
                    <option value="">Category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="field" value={form.sports_category_id} onChange={(e) => setForm({ ...form, sports_category_id: e.target.value })}>
                    <option value="">Sports type</option>
                    {(Array.isArray(sports) ? sports : []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button type="submit" className="btn btn-primary">Create</button>
            </form>

            <div className="player-list">
                {products.map((p) => (
                    <div key={p.id} className="player-item">
                        <div>
                            <strong>{p.name}</strong>
                            <p className="muted">{p.status} · {p.variants?.length || 0} variants · ₹{Number(p.base_price).toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
