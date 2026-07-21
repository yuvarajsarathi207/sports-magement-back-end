import { useEffect, useState } from 'react';
import api from '../../../api/client';
import LoaderScreen from '../../../components/LoaderScreen';
import FormField from '../../../components/FormField';

const emptyForm = {
    name: '',
    sku: '',
    category_id: '',
    price: '',
    stock: 10,
    brand: '',
    description: '',
    is_featured: false,
};

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(emptyForm);
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const load = () => {
        Promise.all([
            api.get('/shop/products', { params: { per_page: 50 } }),
            api.get('/shop/categories', { params: { active_only: false } }),
        ]).then(([p, c]) => {
            setProducts(p.data.data || []);
            setCategories(c.data);
        }).finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    useEffect(() => () => {
        previews.forEach((url) => URL.revokeObjectURL(url));
    }, [previews]);

    const onPickImages = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const next = [...images, ...files].slice(0, 8);
        setImages(next);
        setPreviews(next.map((file) => URL.createObjectURL(file)));
        e.target.value = '';
    };

    const removeImage = (index) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const create = async (e) => {
        e.preventDefault();
        setMsg('');
        setError('');
        setSaving(true);

        try {
            const body = new FormData();
            body.append('name', form.name);
            body.append('sku', form.sku);
            body.append('category_id', form.category_id);
            body.append('price', form.price);
            body.append('stock', String(form.stock ?? 0));
            body.append('brand', form.brand || '');
            body.append('description', form.description || '');
            body.append('status', 'active');
            body.append('is_featured', form.is_featured ? '1' : '0');

            images.forEach((file) => {
                body.append('images[]', file);
            });

            await api.post('/admin/shop/products', body);
            setForm(emptyForm);
            setImages([]);
            setPreviews([]);
            setMsg(images.length ? 'Product created with images' : 'Product created');
            load();
        } catch (err) {
            const errors = err.response?.data?.errors;
            setError(errors ? Object.values(errors).flat().join(' ') : (err.response?.data?.message || 'Failed'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoaderScreen message="Loading products..." />;

    return (
        <div className="page admin-form-page">
            <h2 className="section-title">Products</h2>

            <form className="ui-panel ui-form" onSubmit={create}>
                <h3 className="ui-panel-title">Add product</h3>
                <div className="form-grid-2">
                    <FormField label="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    <FormField label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required hint="Unique stock code" />
                    <label className="field ui-field">
                        <span className="field-label-row">Category <span className="required-mark">*</span></span>
                        <div className="ui-input-wrap">
                            <select className="select" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required>
                                <option value="">Select category</option>
                                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </label>
                    <FormField label="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                    <FormField label="Price (₹)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                    <FormField label="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                </div>

                <label className="field ui-field">
                    <span className="field-label-row">Description</span>
                    <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Short product description"
                        rows={3}
                    />
                </label>

                <div className="field ui-field">
                    <span className="field-label-row">Product images</span>
                    <label className={`file-upload${images.length ? ' has-file' : ''}`}>
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            multiple
                            onChange={onPickImages}
                        />
                        <span className="file-upload-icon">📷</span>
                        <span className="file-upload-name">
                            {images.length ? `${images.length} image(s) selected` : 'Click to upload images'}
                        </span>
                        <span className="file-upload-hint">PNG, JPG, WEBP up to 5MB each · max 8</span>
                    </label>

                    {previews.length > 0 && (
                        <div className="image-preview-grid">
                            {previews.map((src, index) => (
                                <div key={src} className="image-preview-item">
                                    <img src={src} alt={`Preview ${index + 1}`} />
                                    {index === 0 && <span className="image-preview-badge">Primary</span>}
                                    <button type="button" className="image-preview-remove" onClick={() => removeImage(index)}>
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <label className="terms-check">
                    <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
                    <span>Mark as featured on store home</span>
                </label>

                <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Add product'}
                </button>
                {msg && <p className="form-success">{msg}</p>}
                {error && <p className="form-error">{error}</p>}
            </form>

            <div className="card-list" style={{ marginTop: 20 }}>
                {products.map((p) => (
                    <div key={p.id} className="order-card">
                        <div className="product-list-thumb">
                            {p.primary_image_url ? (
                                <img src={p.primary_image_url} alt={p.name} />
                            ) : (
                                <span>🛍️</span>
                            )}
                        </div>
                        <div>
                            <strong>{p.name}</strong>
                            <p className="text-muted">{p.sku} · stock {p.stock}</p>
                        </div>
                        <div className="order-card-right">
                            <span>₹{p.price}</span>
                            <button
                                type="button"
                                className="btn-link danger"
                                onClick={async () => {
                                    await api.delete(`/admin/shop/products/${p.id}`);
                                    load();
                                }}
                            >Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
