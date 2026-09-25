import { useEffect, useState } from 'react';
import api from '../../../api/client';
import Alert from '../../../components/Alert';
import LoaderScreen from '../../../components/LoaderScreen';

const emptyForm = {
    name: '', description: '', base_price: '', discount_price: '', initial_stock: 10,
    status: 'active', product_category_id: '', sports_category_id: '', sku: '',
};

export default function AdminCommerceProducts() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [sports, setSports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);

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

    const resetForm = () => {
        setEditingId(null);
        setForm(emptyForm);
    };

    const startEdit = (p) => {
        setEditingId(p.id);
        setForm({
            name: p.name || '',
            description: p.description || '',
            base_price: p.base_price ?? '',
            discount_price: p.discount_price ?? '',
            initial_stock: '',
            status: p.status || 'active',
            product_category_id: p.product_category_id || '',
            sports_category_id: p.sports_category_id || '',
            sku: p.sku || '',
        });
        setMessage('');
        setError('');
    };

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setSaving(true);
        try {
            const payload = {
                name: form.name,
                description: form.description || null,
                base_price: Number(form.base_price),
                discount_price: form.discount_price ? Number(form.discount_price) : null,
                status: form.status,
                product_category_id: form.product_category_id || null,
                sports_category_id: form.sports_category_id || null,
                sku: form.sku || null,
            };

            if (editingId) {
                await api.put(`/admin/commerce/products/${editingId}`, payload);
                setMessage('Product updated');
            } else {
                await api.post('/admin/commerce/products', {
                    ...payload,
                    initial_stock: Number(form.initial_stock || 0),
                });
                setMessage('Product created');
            }
            resetForm();
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const remove = async (p) => {
        if (!window.confirm(`Delete product "${p.name}"?`)) return;
        try {
            await api.delete(`/admin/commerce/products/${p.id}`);
            setMessage('Product deleted');
            if (editingId === p.id) resetForm();
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed');
        }
    };

    if (loading) return <LoaderScreen message="Loading products..." />;

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-header-text">
                    <h1 className="page-title">Commerce Products</h1>
                    <p className="page-subtitle">Create, edit, and remove catalog products.</p>
                </div>
            </div>

            {error && <Alert type="error">{error}</Alert>}
            {message && <Alert type="success">{message}</Alert>}

            <div className="ui-grid-2">
                <form className="ui-card" onSubmit={submit}>
                    <div className="ui-card-header">
                        <h2>{editingId ? 'Edit product' : 'Add product'}</h2>
                        {editingId && <button type="button" className="btn btn-ghost" onClick={resetForm}>New</button>}
                    </div>
                    <div className="ui-card-body form-grid">
                        <label className="form-field form-field-full">
                            <span>Name</span>
                            <input className="form-control" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </label>
                        <label className="form-field form-field-full">
                            <span>Description</span>
                            <textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        </label>
                        <label className="form-field">
                            <span>SKU</span>
                            <input className="form-control" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                        </label>
                        <label className="form-field">
                            <span>Status</span>
                            <select className="form-control" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                        </label>
                        <label className="form-field">
                            <span>Price</span>
                            <input className="form-control" required type="number" step="0.01" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} />
                        </label>
                        <label className="form-field">
                            <span>Discount price</span>
                            <input className="form-control" type="number" step="0.01" value={form.discount_price} onChange={(e) => setForm({ ...form, discount_price: e.target.value })} />
                        </label>
                        {!editingId && (
                            <label className="form-field">
                                <span>Initial stock</span>
                                <input className="form-control" type="number" value={form.initial_stock} onChange={(e) => setForm({ ...form, initial_stock: e.target.value })} />
                            </label>
                        )}
                        <label className="form-field">
                            <span>Category</span>
                            <select className="form-control" value={form.product_category_id} onChange={(e) => setForm({ ...form, product_category_id: e.target.value })}>
                                <option value="">Select</option>
                                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </label>
                        <label className="form-field">
                            <span>Sport</span>
                            <select className="form-control" value={form.sports_category_id} onChange={(e) => setForm({ ...form, sports_category_id: e.target.value })}>
                                <option value="">Select</option>
                                {(Array.isArray(sports) ? sports : []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </label>
                    </div>
                    <div className="ui-card-footer">
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving…' : editingId ? 'Update product' : 'Create product'}
                        </button>
                    </div>
                </form>

                <div className="ui-card">
                    <div className="ui-card-header"><h2>Catalog ({products.length})</h2></div>
                    <div className="ui-card-body stack-list">
                        {products.map((p) => (
                            <div key={p.id} className="list-card">
                                <div>
                                    <h3>{p.name}</h3>
                                    <p className="muted">{p.status} · {p.variants?.length || 0} variants · ₹{Number(p.base_price).toLocaleString()}</p>
                                </div>
                                <div className="row-actions">
                                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => startEdit(p)}>Edit</button>
                                    <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(p)}>Delete</button>
                                </div>
                            </div>
                        ))}
                        {!products.length && <p className="empty-state">No products yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
