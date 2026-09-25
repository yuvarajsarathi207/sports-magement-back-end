import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../../api/client';

const TABS = [
    { id: 'details', label: 'Details' },
    { id: 'courts', label: 'Courts' },
    { id: 'hours', label: 'Hours' },
    { id: 'exceptions', label: 'Exceptions' },
    { id: 'pricing', label: 'Pricing' },
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const defaultHours = () => DAY_LABELS.map((_, day) => ({
    day_of_week: day,
    open_time: '06:00',
    close_time: '22:00',
    is_closed: false,
}));

function timeValue(t) {
    if (!t) return '06:00';
    return String(t).slice(0, 5);
}

export default function OwnerVenueDetail() {
    const { id } = useParams();
    const [tab, setTab] = useState('details');
    const [venue, setVenue] = useState(null);
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);

    const [detailsForm, setDetailsForm] = useState(null);
    const [courtForm, setCourtForm] = useState({ name: '', base_price: 500, sports_category_id: '', is_active: true });
    const [editingCourt, setEditingCourt] = useState(null);

    const [hoursCourtId, setHoursCourtId] = useState('');
    const [weeklyHours, setWeeklyHours] = useState(defaultHours());

    const [excCourtId, setExcCourtId] = useState('');
    const [exceptions, setExceptions] = useState([]);
    const [excForm, setExcForm] = useState({
        exception_date: '',
        is_closed: true,
        open_time: '06:00',
        close_time: '22:00',
        reason: '',
    });

    const [priceCourtId, setPriceCourtId] = useState('');
    const [priceRules, setPriceRules] = useState([]);
    const [priceForm, setPriceForm] = useState({
        name: 'Peak',
        day_of_week: '',
        start_time: '17:00',
        end_time: '21:00',
        price: 800,
        is_peak: true,
        is_weekend: false,
    });

    const load = async () => {
        setError('');
        try {
            const { data } = await api.get(`/turf/owner/venues/${id}`);
            setVenue(data);
            setDetailsForm({
                name: data.name || '',
                description: data.description || '',
                address_line1: data.address_line1 || '',
                address_line2: data.address_line2 || '',
                city: data.city || '',
                state: data.state || '',
                pincode: data.pincode || '',
                slot_duration_minutes: data.slot_duration_minutes || 60,
            });
            const firstCourt = data.courts?.[0];
            if (firstCourt) {
                setHoursCourtId((prev) => prev || String(firstCourt.id));
                setExcCourtId((prev) => prev || String(firstCourt.id));
                setPriceCourtId((prev) => prev || String(firstCourt.id));
            }
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load venue');
        }
    };

    useEffect(() => {
        load();
        api.get('/sports-categories')
            .then(({ data }) => {
                const list = data.categories || data.data || data || [];
                setCategories(Array.isArray(list) ? list : []);
            })
            .catch(() => {});
    }, [id]);

    const selectedHoursCourt = useMemo(
        () => (venue?.courts || []).find((c) => String(c.id) === String(hoursCourtId)),
        [venue, hoursCourtId]
    );

    useEffect(() => {
        if (!selectedHoursCourt) return;
        const rules = selectedHoursCourt.availability_rules || selectedHoursCourt.availabilityRules || [];
        if (rules.length) {
            const mapped = defaultHours().map((d) => {
                const found = rules.find((r) => Number(r.day_of_week) === d.day_of_week);
                if (!found) return d;
                return {
                    day_of_week: d.day_of_week,
                    open_time: timeValue(found.open_time),
                    close_time: timeValue(found.close_time),
                    is_closed: !!found.is_closed,
                };
            });
            setWeeklyHours(mapped);
        } else {
            setWeeklyHours(defaultHours());
        }
    }, [selectedHoursCourt]);

    useEffect(() => {
        if (!excCourtId) return;
        (async () => {
            try {
                const { data } = await api.get(`/turf/owner/courts/${excCourtId}/exceptions`);
                setExceptions(data || []);
            } catch {
                setExceptions([]);
            }
        })();
    }, [excCourtId]);

    useEffect(() => {
        if (!priceCourtId) return;
        (async () => {
            try {
                const { data } = await api.get(`/turf/owner/courts/${priceCourtId}/price-rules`);
                setPriceRules(data || []);
            } catch {
                setPriceRules([]);
            }
        })();
    }, [priceCourtId]);

    const saveDetails = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setMessage('');
        try {
            await api.put(`/turf/owner/venues/${id}`, detailsForm);
            setMessage('Venue updated');
            await load();
        } catch (err) {
            setError(err.response?.data?.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    const addCourt = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            await api.post(`/turf/owner/venues/${id}/courts`, {
                name: courtForm.name,
                base_price: Number(courtForm.base_price),
                sports_category_id: courtForm.sports_category_id || null,
                is_active: !!courtForm.is_active,
            });
            setCourtForm({ name: '', base_price: 500, sports_category_id: '', is_active: true });
            setMessage('Court added');
            await load();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add court');
        }
    };

    const saveCourtEdit = async (e) => {
        e.preventDefault();
        if (!editingCourt) return;
        setError('');
        setMessage('');
        try {
            await api.put(`/turf/owner/courts/${editingCourt.id}`, {
                name: editingCourt.name,
                base_price: Number(editingCourt.base_price),
                sports_category_id: editingCourt.sports_category_id || null,
                is_active: !!editingCourt.is_active,
            });
            setEditingCourt(null);
            setMessage('Court updated');
            await load();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update court');
        }
    };

    const saveHours = async (e) => {
        e.preventDefault();
        if (!hoursCourtId) return;
        setSaving(true);
        setError('');
        setMessage('');
        try {
            await api.put(`/turf/owner/courts/${hoursCourtId}/weekly-hours`, {
                weekly_hours: weeklyHours.map((h) => ({
                    ...h,
                    open_time: h.is_closed ? null : h.open_time,
                    close_time: h.is_closed ? null : h.close_time,
                })),
            });
            setMessage('Weekly hours saved');
            await load();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save hours');
        } finally {
            setSaving(false);
        }
    };

    const addException = async (e) => {
        e.preventDefault();
        if (!excCourtId) return;
        setError('');
        setMessage('');
        try {
            await api.post(`/turf/owner/courts/${excCourtId}/exceptions`, {
                ...excForm,
                is_closed: !!excForm.is_closed,
                open_time: excForm.is_closed ? null : excForm.open_time,
                close_time: excForm.is_closed ? null : excForm.close_time,
            });
            setExcForm({
                exception_date: '',
                is_closed: true,
                open_time: '06:00',
                close_time: '22:00',
                reason: '',
            });
            setMessage('Exception saved');
            const { data } = await api.get(`/turf/owner/courts/${excCourtId}/exceptions`);
            setExceptions(data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add exception');
        }
    };

    const deleteException = async (excId) => {
        if (!window.confirm('Delete this exception?')) return;
        try {
            await api.delete(`/turf/owner/exceptions/${excId}`);
            setExceptions((list) => list.filter((x) => x.id !== excId));
            setMessage('Exception deleted');
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed');
        }
    };

    const addPriceRule = async (e) => {
        e.preventDefault();
        if (!priceCourtId) return;
        setError('');
        setMessage('');
        try {
            await api.post(`/turf/owner/courts/${priceCourtId}/price-rules`, {
                name: priceForm.name,
                day_of_week: priceForm.day_of_week === '' ? null : Number(priceForm.day_of_week),
                start_time: priceForm.start_time || null,
                end_time: priceForm.end_time || null,
                price: Number(priceForm.price),
                is_peak: !!priceForm.is_peak,
                is_weekend: !!priceForm.is_weekend,
            });
            setPriceForm({
                name: 'Peak',
                day_of_week: '',
                start_time: '17:00',
                end_time: '21:00',
                price: 800,
                is_peak: true,
                is_weekend: false,
            });
            setMessage('Price rule added');
            const { data } = await api.get(`/turf/owner/courts/${priceCourtId}/price-rules`);
            setPriceRules(data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add price rule');
        }
    };

    const deletePriceRule = async (ruleId) => {
        if (!window.confirm('Delete this price rule?')) return;
        try {
            await api.delete(`/turf/owner/price-rules/${ruleId}`);
            setPriceRules((list) => list.filter((r) => r.id !== ruleId));
            setMessage('Price rule deleted');
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed');
        }
    };

    if (!venue || !detailsForm) {
        return <p className="page muted">{error || 'Loading venue…'}</p>;
    }

    const courts = venue.courts || [];

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-header-text">
                    <Link to="/turf/owner/venues" className="muted">← My venues</Link>
                    <h1 className="page-title">{venue.name}</h1>
                    <p className="page-subtitle">
                        {venue.city}, {venue.state}
                        {' · '}
                        <span className={`status-pill status-${venue.is_published ? 'active' : 'inactive'}`}>
                            {venue.is_published ? 'published' : venue.status}
                        </span>
                    </p>
                </div>
            </div>

            <div className="tab-bar filter-chips" role="tablist">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        className={`tab-btn${tab === t.id ? ' active' : ''}`}
                        onClick={() => setTab(t.id)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {error && <p className="error-text">{error}</p>}
            {message && <p className="success-text">{message}</p>}

            {tab === 'details' && (
                <form className="ui-card" onSubmit={saveDetails}>
                    <div className="ui-card-header"><h2>Venue details</h2></div>
                    <div className="ui-card-body form-grid">
                        <label className="form-field form-field-full">
                            <span>Name</span>
                            <input className="form-control" required value={detailsForm.name} onChange={(e) => setDetailsForm({ ...detailsForm, name: e.target.value })} />
                        </label>
                        <label className="form-field form-field-full">
                            <span>Description</span>
                            <textarea className="form-control" value={detailsForm.description} onChange={(e) => setDetailsForm({ ...detailsForm, description: e.target.value })} />
                        </label>
                        <label className="form-field form-field-full">
                            <span>Address</span>
                            <input className="form-control" required value={detailsForm.address_line1} onChange={(e) => setDetailsForm({ ...detailsForm, address_line1: e.target.value })} />
                        </label>
                        <label className="form-field">
                            <span>City</span>
                            <input className="form-control" required value={detailsForm.city} onChange={(e) => setDetailsForm({ ...detailsForm, city: e.target.value })} />
                        </label>
                        <label className="form-field">
                            <span>State</span>
                            <input className="form-control" required value={detailsForm.state} onChange={(e) => setDetailsForm({ ...detailsForm, state: e.target.value })} />
                        </label>
                        <label className="form-field">
                            <span>Pincode</span>
                            <input className="form-control" value={detailsForm.pincode} onChange={(e) => setDetailsForm({ ...detailsForm, pincode: e.target.value })} />
                        </label>
                        <label className="form-field">
                            <span>Slot minutes</span>
                            <input className="form-control" type="number" min={15} max={240} value={detailsForm.slot_duration_minutes} onChange={(e) => setDetailsForm({ ...detailsForm, slot_duration_minutes: e.target.value })} />
                        </label>
                    </div>
                    <div className="ui-card-footer">
                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save details'}</button>
                    </div>
                </form>
            )}

            {tab === 'courts' && (
                <div className="ui-grid-2">
                    <div className="ui-card">
                        <div className="ui-card-header"><h2>Courts ({courts.length})</h2></div>
                        <div className="ui-card-body stack-list">
                            {courts.map((c) => (
                                <div key={c.id} className="list-card">
                                    <div>
                                        <h3>{c.name}</h3>
                                        <p className="muted">₹{c.base_price} · {c.is_active ? 'Active' : 'Inactive'}</p>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => setEditingCourt({
                                            id: c.id,
                                            name: c.name,
                                            base_price: c.base_price,
                                            sports_category_id: c.sports_category_id || '',
                                            is_active: !!c.is_active,
                                        })}
                                    >
                                        Edit
                                    </button>
                                </div>
                            ))}
                            {!courts.length && <p className="empty-state">No courts yet.</p>}
                        </div>
                    </div>

                    <div className="stack-list">
                        {editingCourt && (
                            <form className="ui-card" onSubmit={saveCourtEdit}>
                                <div className="ui-card-header">
                                    <h2>Edit court</h2>
                                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEditingCourt(null)}>Close</button>
                                </div>
                                <div className="ui-card-body form-grid">
                                    <label className="form-field">
                                        <span>Name</span>
                                        <input className="form-control" required value={editingCourt.name} onChange={(e) => setEditingCourt({ ...editingCourt, name: e.target.value })} />
                                    </label>
                                    <label className="form-field">
                                        <span>Base price</span>
                                        <input className="form-control" type="number" required value={editingCourt.base_price} onChange={(e) => setEditingCourt({ ...editingCourt, base_price: e.target.value })} />
                                    </label>
                                    <label className="form-field form-field-full">
                                        <span>Sport</span>
                                        <select className="form-control" value={editingCourt.sports_category_id} onChange={(e) => setEditingCourt({ ...editingCourt, sports_category_id: e.target.value })}>
                                            <option value="">Any</option>
                                            {categories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </label>
                                    <label className="form-field check-row" style={{ alignItems: 'center', marginTop: 8 }}>
                                        <input type="checkbox" checked={editingCourt.is_active} onChange={(e) => setEditingCourt({ ...editingCourt, is_active: e.target.checked })} />
                                        <span>Active</span>
                                    </label>
                                </div>
                                <div className="ui-card-footer">
                                    <button type="submit" className="btn btn-primary">Save court</button>
                                </div>
                            </form>
                        )}

                        <form className="ui-card" onSubmit={addCourt}>
                            <div className="ui-card-header"><h2>Add court</h2></div>
                            <div className="ui-card-body form-grid">
                                <label className="form-field">
                                    <span>Name</span>
                                    <input className="form-control" required value={courtForm.name} onChange={(e) => setCourtForm({ ...courtForm, name: e.target.value })} />
                                </label>
                                <label className="form-field">
                                    <span>Base price</span>
                                    <input className="form-control" type="number" required value={courtForm.base_price} onChange={(e) => setCourtForm({ ...courtForm, base_price: e.target.value })} />
                                </label>
                                <label className="form-field form-field-full">
                                    <span>Sport</span>
                                    <select className="form-control" value={courtForm.sports_category_id} onChange={(e) => setCourtForm({ ...courtForm, sports_category_id: e.target.value })}>
                                        <option value="">Any</option>
                                        {categories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </label>
                            </div>
                            <div className="ui-card-footer">
                                <button type="submit" className="btn btn-primary">Add court</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {tab === 'hours' && (
                <form className="ui-card" onSubmit={saveHours}>
                    <div className="ui-card-header"><h2>Weekly hours</h2></div>
                    <div className="ui-card-body">
                        <label className="form-field" style={{ marginBottom: 16, maxWidth: 320 }}>
                            <span>Court</span>
                            <select className="form-control" value={hoursCourtId} onChange={(e) => setHoursCourtId(e.target.value)}>
                                {courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </label>
                        {!courts.length && <p className="empty-state">Add a court first.</p>}
                        <div className="stack-list">
                            {weeklyHours.map((h, idx) => (
                                <div key={h.day_of_week} className="list-card hours-row">
                                    <strong style={{ minWidth: 40 }}>{DAY_LABELS[h.day_of_week]}</strong>
                                    <label className="check-row" style={{ margin: 0 }}>
                                        <input
                                            type="checkbox"
                                            checked={h.is_closed}
                                            onChange={(e) => {
                                                const next = [...weeklyHours];
                                                next[idx] = { ...h, is_closed: e.target.checked };
                                                setWeeklyHours(next);
                                            }}
                                        />
                                        <span>Closed</span>
                                    </label>
                                    {!h.is_closed && (
                                        <>
                                            <input
                                                className="form-control"
                                                type="time"
                                                value={h.open_time}
                                                onChange={(e) => {
                                                    const next = [...weeklyHours];
                                                    next[idx] = { ...h, open_time: e.target.value };
                                                    setWeeklyHours(next);
                                                }}
                                            />
                                            <input
                                                className="form-control"
                                                type="time"
                                                value={h.close_time}
                                                onChange={(e) => {
                                                    const next = [...weeklyHours];
                                                    next[idx] = { ...h, close_time: e.target.value };
                                                    setWeeklyHours(next);
                                                }}
                                            />
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="ui-card-footer">
                        <button type="submit" className="btn btn-primary" disabled={!hoursCourtId || saving}>
                            {saving ? 'Saving…' : 'Save hours'}
                        </button>
                    </div>
                </form>
            )}

            {tab === 'exceptions' && (
                <div className="ui-grid-2">
                    <div className="ui-card">
                        <div className="ui-card-header"><h2>Exceptions</h2></div>
                        <div className="ui-card-body">
                            <label className="form-field" style={{ marginBottom: 12 }}>
                                <span>Court</span>
                                <select className="form-control" value={excCourtId} onChange={(e) => setExcCourtId(e.target.value)}>
                                    {courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </label>
                            <div className="stack-list">
                                {exceptions.map((ex) => (
                                    <div key={ex.id} className="list-card">
                                        <div>
                                            <h3>{ex.exception_date}</h3>
                                            <p className="muted">
                                                {ex.is_closed ? 'Closed' : `${timeValue(ex.open_time)} – ${timeValue(ex.close_time)}`}
                                                {ex.reason ? ` · ${ex.reason}` : ''}
                                            </p>
                                        </div>
                                        <button type="button" className="btn btn-sm btn-danger" onClick={() => deleteException(ex.id)}>Delete</button>
                                    </div>
                                ))}
                                {!exceptions.length && <p className="empty-state">No exceptions.</p>}
                            </div>
                        </div>
                    </div>

                    <form className="ui-card" onSubmit={addException}>
                        <div className="ui-card-header"><h2>Add exception</h2></div>
                        <div className="ui-card-body form-grid">
                            <label className="form-field form-field-full">
                                <span>Date</span>
                                <input className="form-control" type="date" required value={excForm.exception_date} onChange={(e) => setExcForm({ ...excForm, exception_date: e.target.value })} />
                            </label>
                            <label className="form-field check-row" style={{ alignItems: 'center' }}>
                                <input type="checkbox" checked={excForm.is_closed} onChange={(e) => setExcForm({ ...excForm, is_closed: e.target.checked })} />
                                <span>Closed all day</span>
                            </label>
                            {!excForm.is_closed && (
                                <>
                                    <label className="form-field">
                                        <span>Open</span>
                                        <input className="form-control" type="time" value={excForm.open_time} onChange={(e) => setExcForm({ ...excForm, open_time: e.target.value })} />
                                    </label>
                                    <label className="form-field">
                                        <span>Close</span>
                                        <input className="form-control" type="time" value={excForm.close_time} onChange={(e) => setExcForm({ ...excForm, close_time: e.target.value })} />
                                    </label>
                                </>
                            )}
                            <label className="form-field form-field-full">
                                <span>Reason</span>
                                <input className="form-control" value={excForm.reason} onChange={(e) => setExcForm({ ...excForm, reason: e.target.value })} />
                            </label>
                        </div>
                        <div className="ui-card-footer">
                            <button type="submit" className="btn btn-primary" disabled={!excCourtId}>Add exception</button>
                        </div>
                    </form>
                </div>
            )}

            {tab === 'pricing' && (
                <div className="ui-grid-2">
                    <div className="ui-card">
                        <div className="ui-card-header"><h2>Price rules</h2></div>
                        <div className="ui-card-body">
                            <label className="form-field" style={{ marginBottom: 12 }}>
                                <span>Court</span>
                                <select className="form-control" value={priceCourtId} onChange={(e) => setPriceCourtId(e.target.value)}>
                                    {courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </label>
                            <div className="stack-list">
                                {priceRules.map((r) => (
                                    <div key={r.id} className="list-card">
                                        <div>
                                            <h3>{r.name}</h3>
                                            <p className="muted">
                                                ₹{r.price}
                                                {r.is_peak ? ' · peak' : ''}
                                                {r.day_of_week != null ? ` · ${DAY_LABELS[r.day_of_week]}` : ''}
                                                {r.start_time ? ` · ${timeValue(r.start_time)}–${timeValue(r.end_time)}` : ''}
                                            </p>
                                        </div>
                                        <button type="button" className="btn btn-sm btn-danger" onClick={() => deletePriceRule(r.id)}>Delete</button>
                                    </div>
                                ))}
                                {!priceRules.length && <p className="empty-state">No peak rules yet.</p>}
                            </div>
                        </div>
                    </div>

                    <form className="ui-card" onSubmit={addPriceRule}>
                        <div className="ui-card-header"><h2>Add peak rule</h2></div>
                        <div className="ui-card-body form-grid">
                            <label className="form-field">
                                <span>Name</span>
                                <input className="form-control" required value={priceForm.name} onChange={(e) => setPriceForm({ ...priceForm, name: e.target.value })} />
                            </label>
                            <label className="form-field">
                                <span>Price</span>
                                <input className="form-control" type="number" required min={0} value={priceForm.price} onChange={(e) => setPriceForm({ ...priceForm, price: e.target.value })} />
                            </label>
                            <label className="form-field">
                                <span>Day</span>
                                <select className="form-control" value={priceForm.day_of_week} onChange={(e) => setPriceForm({ ...priceForm, day_of_week: e.target.value })}>
                                    <option value="">Any day</option>
                                    {DAY_LABELS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                                </select>
                            </label>
                            <label className="form-field">
                                <span>Start</span>
                                <input className="form-control" type="time" value={priceForm.start_time} onChange={(e) => setPriceForm({ ...priceForm, start_time: e.target.value })} />
                            </label>
                            <label className="form-field">
                                <span>End</span>
                                <input className="form-control" type="time" value={priceForm.end_time} onChange={(e) => setPriceForm({ ...priceForm, end_time: e.target.value })} />
                            </label>
                            <label className="form-field check-row" style={{ alignItems: 'center' }}>
                                <input type="checkbox" checked={priceForm.is_peak} onChange={(e) => setPriceForm({ ...priceForm, is_peak: e.target.checked })} />
                                <span>Peak</span>
                            </label>
                        </div>
                        <div className="ui-card-footer">
                            <button type="submit" className="btn btn-primary" disabled={!priceCourtId}>Add rule</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
