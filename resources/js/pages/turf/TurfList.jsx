import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

export default function TurfList({ basePath = '/turf' }) {
    const [turfs, setTurfs] = useState([]);
    const [sports, setSports] = useState([]);
    const [filters, setFilters] = useState({
        city: '',
        sport_id: '',
        min_price: '',
        max_price: '',
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadSports = async () => {
        try {
            const { data } = await api.get('/sports-categories');
            const list = data.categories || data.data || data || [];
            setSports(Array.isArray(list) ? list : []);
        } catch {
            setSports([]);
        }
    };

    const load = async (nextFilters = filters) => {
        setLoading(true);
        setError('');
        try {
            const params = {};
            if (nextFilters.city) params.city = nextFilters.city;
            if (nextFilters.sport_id) params.sport_id = nextFilters.sport_id;
            if (nextFilters.min_price !== '' && nextFilters.min_price != null) params.min_price = nextFilters.min_price;
            if (nextFilters.max_price !== '' && nextFilters.max_price != null) params.max_price = nextFilters.max_price;

            const { data } = await api.get('/turf/venues', { params });
            setTurfs(data.data || data || []);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load turfs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSports();
        load();
    }, []);

    const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

    const clearFilters = () => {
        const blank = { city: '', sport_id: '', min_price: '', max_price: '' };
        setFilters(blank);
        load(blank);
    };

    const minPrice = (turf) => {
        const prices = (turf.courts || []).map((c) => Number(c.base_price)).filter((n) => !Number.isNaN(n));
        return prices.length ? Math.min(...prices) : null;
    };

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-header-text">
                    <h1 className="page-title">Turf Booking</h1>
                    <p className="page-subtitle">Find courts and book slots near you.</p>
                </div>
            </div>

            <form
                className="ui-card filter-card"
                style={{ marginBottom: 16 }}
                onSubmit={(e) => {
                    e.preventDefault();
                    load();
                }}
            >
                <div className="ui-card-body form-grid">
                    <label className="form-field">
                        <span>City</span>
                        <input
                            className="form-control"
                            type="text"
                            placeholder="Filter by city"
                            value={filters.city}
                            onChange={setFilter('city')}
                        />
                    </label>
                    <label className="form-field">
                        <span>Sport</span>
                        <select className="form-control" value={filters.sport_id} onChange={setFilter('sport_id')}>
                            <option value="">All sports</option>
                            {sports.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </label>
                    <label className="form-field">
                        <span>Min price</span>
                        <input
                            className="form-control"
                            type="number"
                            min={0}
                            step="1"
                            placeholder="₹"
                            value={filters.min_price}
                            onChange={setFilter('min_price')}
                        />
                    </label>
                    <label className="form-field">
                        <span>Max price</span>
                        <input
                            className="form-control"
                            type="number"
                            min={0}
                            step="1"
                            placeholder="₹"
                            value={filters.max_price}
                            onChange={setFilter('max_price')}
                        />
                    </label>
                </div>
                <div className="ui-card-footer filter-actions">
                    <button type="button" className="btn btn-secondary" onClick={clearFilters}>Clear</button>
                    <button type="submit" className="btn btn-primary">Search</button>
                </div>
            </form>

            {loading && <p className="muted">Loading venues…</p>}
            {error && <p className="error-text">{error}</p>}

            <div className="card-grid">
                {turfs.map((turf) => {
                    const from = minPrice(turf);
                    return (
                        <Link key={turf.id} to={`${basePath}/${turf.id}`} className="ui-card entity-card">
                            <div className="ui-card-body" style={{ padding: 0 }}>
                                <h3 style={{ margin: '0 0 6px' }}>{turf.name}</h3>
                                <p style={{ margin: '0 0 8px' }}>{turf.city}, {turf.state}</p>
                                <div className="pill-row">
                                    <span className="mini-pill">{turf.courts?.length || 0} courts</span>
                                    {from != null && <span className="mini-pill">from ₹{from}</span>}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {!loading && !turfs.length && (
                <div className="ui-card"><p className="empty-state">No published turfs match your filters.</p></div>
            )}
        </div>
    );
}
