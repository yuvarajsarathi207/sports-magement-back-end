import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';
import Alert from '../../components/Alert';
import LoaderScreen from '../../components/LoaderScreen';

const emptyRole = { name: '', display_name: '', description: '', permission_ids: [] };
const emptyPermission = { name: '', display_name: '', module: '', description: '' };

export default function AdminAccessPermissions() {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [tab, setTab] = useState('roles');
    const [roleForm, setRoleForm] = useState(emptyRole);
    const [editingRoleId, setEditingRoleId] = useState(null);
    const [permForm, setPermForm] = useState(emptyPermission);
    const [editingPermId, setEditingPermId] = useState(null);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get('/admin/rbac/overview');
            setRoles(data.roles || []);
            setPermissions(data.permissions || []);
            setSummary(data.users_summary || null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load access data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const permissionsByModule = useMemo(() => {
        const map = {};
        permissions.forEach((p) => {
            const key = p.module || 'general';
            if (!map[key]) map[key] = [];
            map[key].push(p);
        });
        return map;
    }, [permissions]);

    const startEditRole = (role) => {
        setEditingRoleId(role.id);
        setRoleForm({
            name: role.name,
            display_name: role.display_name,
            description: role.description || '',
            permission_ids: (role.permissions || []).map((p) => p.id),
        });
        setTab('roles');
        setMessage('');
        setError('');
    };

    const resetRoleForm = () => {
        setEditingRoleId(null);
        setRoleForm(emptyRole);
    };

    const togglePermission = (id) => {
        setRoleForm((prev) => {
            const exists = prev.permission_ids.includes(id);
            return {
                ...prev,
                permission_ids: exists
                    ? prev.permission_ids.filter((x) => x !== id)
                    : [...prev.permission_ids, id],
            };
        });
    };

    const saveRole = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setMessage('');
        try {
            if (editingRoleId) {
                await api.put(`/admin/rbac/roles/${editingRoleId}`, roleForm);
                setMessage('Role updated');
            } else {
                await api.post('/admin/rbac/roles', roleForm);
                setMessage('Role created');
            }
            resetRoleForm();
            await load();
        } catch (err) {
            setError(err.response?.data?.message || Object.values(err.response?.data?.errors || {}).flat().join(' ') || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const deleteRole = async (role) => {
        if (!window.confirm(`Delete role "${role.display_name}"?`)) return;
        setError('');
        try {
            await api.delete(`/admin/rbac/roles/${role.id}`);
            setMessage('Role deleted');
            if (editingRoleId === role.id) resetRoleForm();
            await load();
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed');
        }
    };

    const startEditPermission = (perm) => {
        setEditingPermId(perm.id);
        setPermForm({
            name: perm.name,
            display_name: perm.display_name,
            module: perm.module || '',
            description: perm.description || '',
        });
        setTab('permissions');
    };

    const resetPermForm = () => {
        setEditingPermId(null);
        setPermForm(emptyPermission);
    };

    const savePermission = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setMessage('');
        try {
            if (editingPermId) {
                await api.put(`/admin/rbac/permissions/${editingPermId}`, permForm);
                setMessage('Permission updated');
            } else {
                await api.post('/admin/rbac/permissions', permForm);
                setMessage('Permission created');
            }
            resetPermForm();
            await load();
        } catch (err) {
            setError(err.response?.data?.message || Object.values(err.response?.data?.errors || {}).flat().join(' ') || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const deletePermission = async (perm) => {
        if (!window.confirm(`Delete permission "${perm.name}"?`)) return;
        setError('');
        try {
            await api.delete(`/admin/rbac/permissions/${perm.id}`);
            setMessage('Permission deleted');
            if (editingPermId === perm.id) resetPermForm();
            await load();
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed');
        }
    };

    if (loading) return <LoaderScreen message="Loading access & permissions..." />;

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-header-text">
                    <h1 className="page-title">Access & Permissions</h1>
                    <p className="page-subtitle">Manage roles, permissions, and module access for the platform.</p>
                </div>
            </div>

            {error && <Alert type="error">{error}</Alert>}
            {message && <Alert type="success">{message}</Alert>}

            {summary && (
                <div className="stat-grid" style={{ marginBottom: 16 }}>
                    <div className="ui-card stat-card">
                        <p className="muted">Total users</p>
                        <h3>{summary.total}</h3>
                    </div>
                    {Object.entries(summary.by_role || {}).map(([role, count]) => (
                        <div key={role} className="ui-card stat-card">
                            <p className="muted">{role}</p>
                            <h3>{count}</h3>
                        </div>
                    ))}
                </div>
            )}

            <div className="tab-bar">
                <button type="button" className={`tab-btn${tab === 'roles' ? ' active' : ''}`} onClick={() => setTab('roles')}>Roles</button>
                <button type="button" className={`tab-btn${tab === 'permissions' ? ' active' : ''}`} onClick={() => setTab('permissions')}>Permissions</button>
            </div>

            {tab === 'roles' && (
                <div className="ui-grid-2">
                    <form className="ui-card" onSubmit={saveRole}>
                        <div className="ui-card-header">
                            <h2>{editingRoleId ? 'Edit role' : 'Create role'}</h2>
                            {editingRoleId && <button type="button" className="btn btn-ghost" onClick={resetRoleForm}>New</button>}
                        </div>
                        <div className="ui-card-body form-grid">
                            <label className="form-field">
                                <span>Key name</span>
                                <input className="form-control" required pattern="[a-z0-9_]+" placeholder="e.g. shop_ops" value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} />
                            </label>
                            <label className="form-field">
                                <span>Display name</span>
                                <input className="form-control" required value={roleForm.display_name} onChange={(e) => setRoleForm({ ...roleForm, display_name: e.target.value })} />
                            </label>
                            <label className="form-field form-field-full">
                                <span>Description</span>
                                <input className="form-control" value={roleForm.description} onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })} />
                            </label>
                            <div className="form-field form-field-full">
                                <span>Permissions</span>
                                <div className="permission-checklist">
                                    {Object.entries(permissionsByModule).map(([module, items]) => (
                                        <div key={module} className="permission-group">
                                            <h4>{module}</h4>
                                            {items.map((p) => (
                                                <label key={p.id} className="check-row">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleForm.permission_ids.includes(p.id)}
                                                        onChange={() => togglePermission(p.id)}
                                                    />
                                                    <span>
                                                        <strong>{p.display_name}</strong>
                                                        <small>{p.name}</small>
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="ui-card-footer">
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Saving…' : editingRoleId ? 'Update role' : 'Create role'}
                            </button>
                        </div>
                    </form>

                    <div className="ui-card">
                        <div className="ui-card-header"><h2>All roles</h2></div>
                        <div className="ui-card-body stack-list">
                            {roles.map((role) => (
                                <div key={role.id} className="list-card">
                                    <div>
                                        <h3>{role.display_name}</h3>
                                        <p className="muted">{role.name} · {role.users_count || 0} users · {(role.permissions || []).length} permissions</p>
                                        <div className="pill-row">
                                            {(role.permissions || []).slice(0, 6).map((p) => (
                                                <span key={p.id} className="mini-pill">{p.name}</span>
                                            ))}
                                            {(role.permissions || []).length > 6 && <span className="mini-pill">+{role.permissions.length - 6}</span>}
                                        </div>
                                    </div>
                                    <div className="row-actions">
                                        <button type="button" className="btn btn-sm btn-secondary" onClick={() => startEditRole(role)}>Edit</button>
                                        <button type="button" className="btn btn-sm btn-danger" onClick={() => deleteRole(role)}>Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {tab === 'permissions' && (
                <div className="ui-grid-2">
                    <form className="ui-card" onSubmit={savePermission}>
                        <div className="ui-card-header">
                            <h2>{editingPermId ? 'Edit permission' : 'Create permission'}</h2>
                            {editingPermId && <button type="button" className="btn btn-ghost" onClick={resetPermForm}>New</button>}
                        </div>
                        <div className="ui-card-body form-grid">
                            <label className="form-field">
                                <span>Key name</span>
                                <input className="form-control" required pattern="[a-z0-9_.]+" placeholder="e.g. shop.coupon.manage" value={permForm.name} onChange={(e) => setPermForm({ ...permForm, name: e.target.value })} />
                            </label>
                            <label className="form-field">
                                <span>Display name</span>
                                <input className="form-control" required value={permForm.display_name} onChange={(e) => setPermForm({ ...permForm, display_name: e.target.value })} />
                            </label>
                            <label className="form-field">
                                <span>Module</span>
                                <input className="form-control" placeholder="shop / tournament / turf / platform" value={permForm.module} onChange={(e) => setPermForm({ ...permForm, module: e.target.value })} />
                            </label>
                            <label className="form-field form-field-full">
                                <span>Description</span>
                                <input className="form-control" value={permForm.description} onChange={(e) => setPermForm({ ...permForm, description: e.target.value })} />
                            </label>
                        </div>
                        <div className="ui-card-footer">
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Saving…' : editingPermId ? 'Update permission' : 'Create permission'}
                            </button>
                        </div>
                    </form>

                    <div className="ui-card">
                        <div className="ui-card-header"><h2>All permissions</h2></div>
                        <div className="ui-card-body" style={{ padding: 0 }}>
                            <div className="data-table-wrap">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Module</th>
                                            <th>Display</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {permissions.map((p) => (
                                            <tr key={p.id}>
                                                <td><code>{p.name}</code></td>
                                                <td>{p.module || '—'}</td>
                                                <td>{p.display_name}</td>
                                                <td>
                                                    <div className="row-actions">
                                                        <button type="button" className="btn btn-sm btn-secondary" onClick={() => startEditPermission(p)}>Edit</button>
                                                        <button type="button" className="btn btn-sm btn-danger" onClick={() => deletePermission(p)}>Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
