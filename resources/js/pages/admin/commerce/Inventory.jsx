import { useEffect, useState } from 'react';
import api from '../../../api/client';
import Alert from '../../../components/Alert';
import LoaderScreen from '../../../components/LoaderScreen';

const emptyStockForm = { product_variant_id: '', quantity: 1, notes: '', mode: 'in' };

export default function AdminCommerceInventory() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [stockForm, setStockForm] = useState(emptyStockForm);
    const [editing, setEditing] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [lowOnly, setLowOnly] = useState(false);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get('/admin/commerce/inventory', {
                params: lowOnly ? { low_stock: 1 } : {},
            });
            setRows(data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [lowOnly]);

    const submitStock = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            const endpoint = stockForm.mode === 'out'
                ? '/admin/commerce/inventory/stock-out'
                : stockForm.mode === 'adjust'
                    ? '/admin/commerce/inventory/adjust'
                    : '/admin/commerce/inventory/stock-in';

            const payload = stockForm.mode === 'adjust'
                ? {
                    product_variant_id: Number(stockForm.product_variant_id),
                    available_quantity: Number(stockForm.quantity),
                    notes: stockForm.notes || undefined,
                }
                : {
                    product_variant_id: Number(stockForm.product_variant_id),
                    quantity: Number(stockForm.quantity),
                    notes: stockForm.notes || undefined,
                };

            await api.post(endpoint, payload);
            setMessage(stockForm.mode === 'out' ? 'Stock removed' : stockForm.mode === 'adjust' ? 'Stock adjusted' : 'Stock added');
            setStockForm(emptyStockForm);
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Stock update failed');
        }
    };

    const openEdit = (row) => {
        setEditing(row);
        setEditForm({
            sku: row.sku || '',
            name: row.name || '',
            size: row.size || '',
            color: row.color || '',
            price: row.price ?? '',
            discount_price: row.discount_price ?? '',
            status: row.status || 'active',
            available_quantity: row.available_quantity ?? 0,
            notes: '',
        });
        setError('');
        setMessage('');
    };

    const saveEdit = async (e) => {
        e.preventDefault();
        if (!editing) return;
        setSaving(true);
        setError('');
        try {
            await api.put(`/admin/commerce/variants/${editing.id}`, {
                sku: editForm.sku,
                name: editForm.name || null,
                size: editForm.size || null,
                color: editForm.color || null,
                price: Number(editForm.price),
                discount_price: editForm.discount_price === '' ? null : Number(editForm.discount_price),
                status: editForm.status,
                available_quantity: Number(editForm.available_quantity),
                notes: editForm.notes || undefined,
            });
            setMessage('Variant updated');
            setEditing(null);
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    const removeVariant = async (row) => {
        if (!window.confirm(`Delete variant "${row.sku}" for ${row.product?.name}?`)) return;
        setError('');
        try {
            await api.delete(`/admin/commerce/variants/${row.id}`);
            setMessage('Variant deleted');
            if (editing?.id === row.id) setEditing(null);
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed');
        }
    };

    if (loading && !rows.length) return <LoaderScreen message="Loading inventory..." />;

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-header-text">
                    <h1 className="page-title">Inventory</h1>
                    <p className="page-subtitle">Stock in/out, edit variant details, or remove variants.</p>
                </div>
                <label className="toggle-chip">
                    <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
                    Low stock only
                </label>
            </div>

            {error && <Alert type="error">{error}</Alert>}
            {message && <Alert type="success">{message}</Alert>}

            <div className="ui-grid-2">
                <form className="ui-card" onSubmit={submitStock}>
                    <div className="ui-card-header">
                        <h2>Quick stock update</h2>
                    </div>
                    <div className="ui-card-body form-grid">
                        <label className="form-field">
                            <span>Action</span>
                            <select
                                className="form-control"
                                value={stockForm.mode}
                                onChange={(e) => setStockForm({ ...stockForm, mode: e.target.value })}
                            >
                                <option value="in">Stock in</option>
                                <option value="out">Stock out</option>
                                <option value="adjust">Set exact quantity</option>
                            </select>
                        </label>
                        <label className="form-field">
                            <span>Variant</span>
                            <select
                                className="form-control"
                                required
                                value={stockForm.product_variant_id}
                                onChange={(e) => setStockForm({ ...stockForm, product_variant_id: e.target.value })}
                            >
                                <option value="">Select variant</option>
                                {rows.map((v) => (
                                    <option key={v.id} value={v.id}>
                                        {v.product?.name} · {v.sku} (avail {v.available_quantity})
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="form-field">
                            <span>{stockForm.mode === 'adjust' ? 'Available quantity' : 'Quantity'}</span>
                            <input
                                className="form-control"
                                type="number"
                                min={stockForm.mode === 'adjust' ? 0 : 1}
                                required
                                value={stockForm.quantity}
                                onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                            />
                        </label>
                        <label className="form-field">
                            <span>Notes</span>
                            <input
                                className="form-control"
                                placeholder="Optional note"
                                value={stockForm.notes}
                                onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
                            />
                        </label>
                    </div>
                    <div className="ui-card-footer">
                        <button type="submit" className="btn btn-primary">Apply</button>
                    </div>
                </form>

                {editing && (
                    <form className="ui-card ui-card-accent" onSubmit={saveEdit}>
                        <div className="ui-card-header">
                            <h2>Edit variant</h2>
                            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Close</button>
                        </div>
                        <div className="ui-card-body form-grid">
                            <label className="form-field">
                                <span>Product</span>
                                <input className="form-control" disabled value={editing.product?.name || ''} />
                            </label>
                            <label className="form-field">
                                <span>SKU</span>
                                <input className="form-control" required value={editForm.sku} onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })} />
                            </label>
                            <label className="form-field">
                                <span>Name</span>
                                <input className="form-control" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                            </label>
                            <label className="form-field">
                                <span>Size</span>
                                <input className="form-control" value={editForm.size} onChange={(e) => setEditForm({ ...editForm, size: e.target.value })} />
                            </label>
                            <label className="form-field">
                                <span>Color</span>
                                <input className="form-control" value={editForm.color} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} />
                            </label>
                            <label className="form-field">
                                <span>Price</span>
                                <input className="form-control" type="number" step="0.01" required value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} />
                            </label>
                            <label className="form-field">
                                <span>Discount price</span>
                                <input className="form-control" type="number" step="0.01" value={editForm.discount_price} onChange={(e) => setEditForm({ ...editForm, discount_price: e.target.value })} />
                            </label>
                            <label className="form-field">
                                <span>Status</span>
                                <select className="form-control" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="out_of_stock">Out of stock</option>
                                </select>
                            </label>
                            <label className="form-field">
                                <span>Available qty</span>
                                <input className="form-control" type="number" min={0} required value={editForm.available_quantity} onChange={(e) => setEditForm({ ...editForm, available_quantity: e.target.value })} />
                            </label>
                            <label className="form-field form-field-full">
                                <span>Edit notes</span>
                                <input className="form-control" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
                            </label>
                        </div>
                        <div className="ui-card-footer">
                            <button type="button" className="btn btn-danger" onClick={() => removeVariant(editing)}>Delete</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
                        </div>
                    </form>
                )}
            </div>

            <div className="ui-card" style={{ marginTop: 16 }}>
                <div className="ui-card-header">
                    <h2>Variants ({rows.length})</h2>
                </div>
                <div className="ui-card-body" style={{ padding: 0 }}>
                    <div className="data-table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>SKU</th>
                                    <th>Attrs</th>
                                    <th>Price</th>
                                    <th>Available</th>
                                    <th>Reserved</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((v) => (
                                    <tr key={v.id}>
                                        <td>
                                            <strong>{v.product?.name || '—'}</strong>
                                        </td>
                                        <td>{v.sku}</td>
                                        <td className="muted">{[v.size, v.color].filter(Boolean).join(' / ') || '—'}</td>
                                        <td>₹{Number(v.price || 0).toLocaleString()}</td>
                                        <td><strong>{v.available_quantity}</strong></td>
                                        <td>{v.reserved_quantity}</td>
                                        <td><span className={`status-pill status-${v.status}`}>{v.status}</span></td>
                                        <td>
                                            <div className="row-actions">
                                                <button type="button" className="btn btn-sm btn-secondary" onClick={() => openEdit(v)}>Edit</button>
                                                <button type="button" className="btn btn-sm btn-danger" onClick={() => removeVariant(v)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!rows.length && <p className="empty-state">No inventory rows found.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
