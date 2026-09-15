import { useEffect, useState } from 'react';
import api from '../../../api/client';
import Alert from '../../../components/Alert';
import LoaderScreen from '../../../components/LoaderScreen';

export default function AdminCommerceInventory() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ product_variant_id: '', quantity: 1, notes: '' });

    const load = () => {
        api.get('/admin/commerce/inventory')
            .then((res) => setRows(res.data.data || []))
            .catch((err) => setError(err.response?.data?.message || 'Failed'))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const stockIn = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/commerce/inventory/stock-in', {
                product_variant_id: Number(form.product_variant_id),
                quantity: Number(form.quantity),
                notes: form.notes || undefined,
            });
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Stock-in failed');
        }
    };

    if (loading) return <LoaderScreen message="Loading inventory..." />;

    return (
        <div className="page">
            <h1 className="page-title">Inventory</h1>
            {error && <Alert type="error">{error}</Alert>}
            <form className="card section stack-form" onSubmit={stockIn}>
                <h2 className="dashboard-panel-title">Stock in</h2>
                <select className="field" required value={form.product_variant_id} onChange={(e) => setForm({ ...form, product_variant_id: e.target.value })}>
                    <option value="">Select variant</option>
                    {rows.map((v) => (
                        <option key={v.id} value={v.id}>{v.product?.name} · {v.sku} (avail {v.available_quantity})</option>
                    ))}
                </select>
                <input className="field" type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                <input className="field" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                <button type="submit" className="btn btn-primary">Add stock</button>
            </form>
            <div className="player-list">
                {rows.map((v) => (
                    <div key={v.id} className="player-item">
                        <div>
                            <strong>{v.product?.name}</strong>
                            <p className="muted">{v.sku} · {v.size || '-'} / {v.color || '-'}</p>
                        </div>
                        <div>
                            <strong>{v.available_quantity}</strong>
                            <p className="muted">reserved {v.reserved_quantity}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
