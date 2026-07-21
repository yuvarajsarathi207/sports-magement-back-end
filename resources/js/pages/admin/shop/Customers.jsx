import { useEffect, useState } from 'react';
import api from '../../../api/client';
import LoaderScreen from '../../../components/LoaderScreen';

export default function AdminCustomers() {
    const [users, setUsers] = useState([]);
    const [q, setQ] = useState('');

    const load = () => api.get('/admin/shop/customers', { params: { q } }).then((res) => setUsers(res.data.data || []));

    useEffect(() => { load(); }, []);

    if (!users) return <LoaderScreen />;

    return (
        <div className="page">
            <h2 className="section-title">Users</h2>
            <form className="search-form" onSubmit={(e) => { e.preventDefault(); load(); }}>
                <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users" />
                <button className="btn btn-primary" type="submit">Search</button>
            </form>
            <div className="card-list">
                {users.map((u) => (
                    <div key={u.id} className="order-card">
                        <div>
                            <strong>{u.name}</strong>
                            <p className="text-muted">{u.email} · {u.role}</p>
                            {u.is_blocked && <span className="badge badge-cancelled">Blocked</span>}
                        </div>
                        <div className="btn-row">
                            {u.is_blocked ? (
                                <button type="button" className="btn-link" onClick={async () => { await api.post(`/admin/shop/customers/${u.id}/unblock`); load(); }}>Unblock</button>
                            ) : (
                                <button type="button" className="btn-link danger" onClick={async () => { await api.post(`/admin/shop/customers/${u.id}/block`); load(); }}>Block</button>
                            )}
                            <button type="button" className="btn-link" onClick={async () => {
                                const { data } = await api.post(`/admin/shop/customers/${u.id}/reset-password`);
                                alert(`Temp password: ${data.temporary_password}`);
                            }}>Reset PW</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
