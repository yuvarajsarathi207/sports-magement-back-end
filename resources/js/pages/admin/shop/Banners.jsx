import { useEffect, useState } from 'react';
import api from '../../../api/client';

export default function AdminBanners() {
    const [banners, setBanners] = useState([]);
    const [form, setForm] = useState({
        title: '', subtitle: '', image: 'https://picsum.photos/seed/newbanner/1200/500', type: 'home', redirect_link: '/',
    });

    const load = () => api.get('/shop/banners').then((res) => setBanners(res.data));
    useEffect(() => { load(); }, []);

    return (
        <div className="page">
            <h2 className="section-title">Banners</h2>
            <form className="form-stack" onSubmit={async (e) => {
                e.preventDefault();
                await api.post('/admin/shop/banners', { ...form, is_active: true, display_order: banners.length + 1 });
                setForm({ ...form, title: '', subtitle: '' });
                load();
            }}>
                <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                <input className="input" placeholder="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
                <input className="input" placeholder="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} required />
                <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="home">Home</option>
                    <option value="offer">Offer</option>
                    <option value="tournament">Tournament</option>
                    <option value="promotional">Promotional</option>
                </select>
                <button className="btn btn-primary" type="submit">Add banner</button>
            </form>
            <div className="card-list">
                {banners.map((b) => (
                    <div key={b.id} className="order-card">
                        <div>
                            <strong>{b.title}</strong>
                            <p className="text-muted">{b.type} · {b.is_active ? 'Active' : 'Off'}</p>
                        </div>
                        <div className="btn-row">
                            <button type="button" className="btn-link" onClick={async () => { await api.post(`/admin/shop/banners/${b.id}/toggle`); load(); }}>Toggle</button>
                            <button type="button" className="btn-link danger" onClick={async () => { await api.delete(`/admin/shop/banners/${b.id}`); load(); }}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
