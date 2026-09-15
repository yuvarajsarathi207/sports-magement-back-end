import { useEffect, useState } from 'react';
import api from '../../../api/client';
import Alert from '../../../components/Alert';
import LoaderScreen from '../../../components/LoaderScreen';

export default function AdminCommerceSettings() {
    const [form, setForm] = useState(null);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        api.get('/admin/commerce/settings')
            .then((res) => setForm(res.data))
            .catch((err) => setError(err.response?.data?.message || 'Failed'));
    }, []);

    const save = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            const { data } = await api.put('/admin/commerce/settings', form);
            setForm(data);
            setMessage('Commerce settings saved');
        } catch (err) {
            setError(err.response?.data?.message || 'Save failed');
        }
    };

    if (!form && !error) return <LoaderScreen message="Loading settings..." />;
    if (!form) return <Alert type="error">{error}</Alert>;

    const bool = (key) => !!form[key];
    const setBool = (key, value) => setForm({ ...form, [key]: value });

    return (
        <div className="page">
            <h1 className="page-title">Commerce Settings</h1>
            {error && <Alert type="error">{error}</Alert>}
            {message && <Alert type="success">{message}</Alert>}
            <form className="card section stack-form" onSubmit={save}>
                {[
                    ['commerce_enabled', 'Commerce enabled'],
                    ['commerce_cod_enabled', 'COD enabled'],
                    ['commerce_online_payment_enabled', 'Online payment enabled'],
                ].map(([key, label]) => (
                    <label key={key} className="radio-row">
                        <input type="checkbox" checked={bool(key)} onChange={(e) => setBool(key, e.target.checked)} />
                        <span>{label}</span>
                    </label>
                ))}
                <label className="field-label">COD min amount</label>
                <input className="field" type="number" value={form.commerce_cod_min_amount} onChange={(e) => setForm({ ...form, commerce_cod_min_amount: Number(e.target.value) })} />
                <label className="field-label">COD max amount</label>
                <input className="field" type="number" value={form.commerce_cod_max_amount} onChange={(e) => setForm({ ...form, commerce_cod_max_amount: Number(e.target.value) })} />
                <label className="field-label">Delivery charge</label>
                <input className="field" type="number" value={form.commerce_delivery_charge} onChange={(e) => setForm({ ...form, commerce_delivery_charge: Number(e.target.value) })} />
                <label className="field-label">Free delivery threshold</label>
                <input className="field" type="number" value={form.commerce_free_delivery_threshold} onChange={(e) => setForm({ ...form, commerce_free_delivery_threshold: Number(e.target.value) })} />
                <label className="field-label">Low stock threshold</label>
                <input className="field" type="number" value={form.commerce_low_stock_threshold} onChange={(e) => setForm({ ...form, commerce_low_stock_threshold: Number(e.target.value) })} />
                <button type="submit" className="btn btn-primary">Save</button>
            </form>
        </div>
    );
}
