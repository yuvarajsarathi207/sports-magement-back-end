import { useEffect, useState } from 'react';
import api from '../../../api/client';
import LoaderScreen from '../../../components/LoaderScreen';
import FormField from '../../../components/FormField';

export default function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('🏷️');
    const [loading, setLoading] = useState(true);

    const load = () => api.get('/shop/categories', { params: { active_only: false } })
        .then((res) => setCategories(res.data))
        .finally(() => setLoading(false));

    useEffect(() => {
        load();
    }, []);

    if (loading) return <LoaderScreen />;

    return (
        <div className="page admin-form-page">
            <h2 className="section-title">Categories</h2>
            <form
                className="ui-panel ui-form"
                onSubmit={async (e) => {
                    e.preventDefault();
                    await api.post('/admin/shop/categories', { name, icon, is_active: true });
                    setName('');
                    load();
                }}
            >
                <h3 className="ui-panel-title">Add category</h3>
                <div className="form-grid-2">
                    <FormField label="Category name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Sports Gear" />
                    <FormField label="Icon" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Emoji or icon" />
                </div>
                <button className="btn btn-primary" type="submit">Add category</button>
            </form>
            <div className="card-list" style={{ marginTop: 20 }}>
                {categories.map((c) => (
                    <div key={c.id} className="order-card">
                        <div><strong>{c.icon} {c.name}</strong><p className="text-muted">{c.is_active ? 'Active' : 'Disabled'}</p></div>
                        <div className="btn-row">
                            <button type="button" className="btn-link" onClick={async () => { await api.post(`/admin/shop/categories/${c.id}/toggle`); load(); }}>Toggle</button>
                            <button type="button" className="btn-link danger" onClick={async () => { await api.delete(`/admin/shop/categories/${c.id}`); load(); }}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
