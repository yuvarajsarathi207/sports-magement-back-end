import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import Alert from '../../components/Alert';
import FormLabel from '../../components/FormLabel';
import { INDIAN_STATES } from '../../data/indianStates';
import { composeTournamentLocation } from '../../utils/tournamentLocation';

const initialForm = {
    sports_category_id: '',
    team_name: '',
    state: '',
    city: '',
    district: '',
    pincode: '',
    location_details: '',
    start_date: '',
    winning_date: '',
    slot_count: 16,
    rules: '',
    entry_fee: '',
    price_details: '',
    ball_type: '',
};

const ACCEPTED_TEMPLATE_TYPES = '.pdf,.doc,.docx,.png,.jpg,.jpeg';
const MAX_TEMPLATE_SIZE = 10 * 1024 * 1024;

function validateForm(form, templateFile) {
    const errors = {};

    if (!form.team_name.trim()) errors.team_name = 'Tournament name is required';
    if (!form.state) errors.state = 'State is required';
    if (!form.city.trim()) errors.city = 'City is required';
    if (!form.district.trim()) errors.district = 'District is required';
    if (!form.pincode) errors.pincode = 'Pincode is required';
    else if (form.pincode.length !== 6) errors.pincode = 'Pincode must be 6 digits';
    if (!form.sports_category_id) errors.sports_category_id = 'Sport category is required';
    if (!form.start_date) errors.start_date = 'Start date is required';
    if (!form.winning_date) errors.winning_date = 'Winning date is required';
    if (!form.slot_count || Number(form.slot_count) < 1) errors.slot_count = 'Slots must be at least 1';
    if (form.entry_fee === '' || form.entry_fee === null) errors.entry_fee = 'Entry fee is required';
    else if (Number(form.entry_fee) < 0) errors.entry_fee = 'Entry fee cannot be negative';
    if (!form.rules.trim()) errors.rules = 'Rules are required';
    if (!templateFile) errors.template_file = 'Tournament template is required';

    return errors;
}

export default function CreateTournament() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [templateFile, setTemplateFile] = useState(null);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [showFieldErrors, setShowFieldErrors] = useState(false);
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);

    useEffect(() => {
        api.get('/sports-categories').then((res) => setCategories(res.data));
    }, []);

    const update = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (fieldErrors[key]) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    const fieldClass = (name) => `field${showFieldErrors && fieldErrors[name] ? ' field-invalid' : ''}`;

    const fieldHint = (name) => (
        showFieldErrors && fieldErrors[name] ? (
            <span className="field-error-text">{fieldErrors[name]}</span>
        ) : null
    );

    const getLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported on this device.');
            return;
        }

        setError('');
        setLocating(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                        { headers: { 'Accept-Language': 'en' } }
                    );
                    const data = await response.json();
                    const address = data.address || {};
                    const city = address.city || address.town || address.village || address.suburb || '';
                    const state = address.state || '';
                    const district = address.state_district || address.county || address.district || '';
                    const pincode = (address.postcode || '').replace(/\D/g, '').slice(0, 6);
                    const displayName = data.display_name || `${latitude}, ${longitude}`;

                    if (city) update('city', city.substring(0, 255));
                    if (state) update('state', state.substring(0, 255));
                    if (district) update('district', district.substring(0, 255));
                    if (pincode) update('pincode', pincode);
                    update(
                        'location_details',
                        `${displayName.substring(0, 500)}\nGPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                    );
                } catch {
                    update(
                        'location_details',
                        `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                    );
                } finally {
                    setLocating(false);
                }
            },
            (geoError) => {
                setLocating(false);
                setError(geoError.message || 'Could not get your location. Please allow location access.');
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const handleTemplateChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) {
            setTemplateFile(null);
            return;
        }

        if (file.size > MAX_TEMPLATE_SIZE) {
            setError('Template file must be 10 MB or smaller.');
            e.target.value = '';
            setTemplateFile(null);
            return;
        }

        setError('');
        setTemplateFile(file);
        if (fieldErrors.template_file) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.template_file;
                return next;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const errors = validateForm(form, templateFile);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setShowFieldErrors(true);
            setError('Please fill in all required fields.');
            const firstInvalid = document.querySelector('.field-invalid');
            firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setShowFieldErrors(false);
        setFieldErrors({});

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('sports_category_id', form.sports_category_id);
            formData.append('team_name', form.team_name);
            formData.append('state', form.state);
            formData.append('city', form.city);
            formData.append('district', form.district);
            formData.append('pincode', form.pincode);
            formData.append('location', composeTournamentLocation(form));
            formData.append('start_date', form.start_date);
            formData.append('winning_date', form.winning_date);
            formData.append('slot_count', form.slot_count);
            formData.append('rules', form.rules);
            formData.append('entry_fee', form.entry_fee);
            formData.append('template_file', templateFile);

            if (form.location_details) formData.append('location_details', form.location_details);
            if (form.price_details) formData.append('price_details', form.price_details);
            if (form.ball_type) formData.append('ball_type', form.ball_type);

            const { data } = await api.post('/organizer/tournaments', formData);
            navigate(`/organizer/tournaments/${data.id}`);
        } catch (err) {
            const errors = err.response?.data?.errors;
            setError(errors ? Object.values(errors).flat().join(' ') : 'Failed to create tournament.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <button type="button" className="back-btn" onClick={() => navigate(-1)}>← Back</button>
            <h2 className="page-title">Create Tournament</h2>

            <Alert message={error} />

            <form onSubmit={handleSubmit} className="form-stack" noValidate>
                <label className={fieldClass('team_name')}>
                    <FormLabel icon="🏆" required>Tournament Name</FormLabel>
                    <input
                        value={form.team_name}
                        onChange={(e) => update('team_name', e.target.value)}
                        placeholder="Summer Cricket League"
                    />
                    {fieldHint('team_name')}
                </label>

                <button
                    type="button"
                    className="btn btn-location btn-location-block"
                    onClick={getLocation}
                    disabled={locating}
                >
                    {locating ? '...' : '📍'}
                    <span>{locating ? 'Getting your location...' : 'Get Location'}</span>
                </button>

                <div className="field-row">
                    <label className={fieldClass('state')}>
                        <FormLabel icon="🗺️" required>State</FormLabel>
                        <select
                            value={form.state}
                            onChange={(e) => update('state', e.target.value)}
                            className="select"
                        >
                            <option value="">Select state</option>
                            {INDIAN_STATES.map((state) => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                            {form.state && !INDIAN_STATES.includes(form.state) && (
                                <option value={form.state}>{form.state}</option>
                            )}
                        </select>
                        {fieldHint('state')}
                    </label>
                    <label className={fieldClass('city')}>
                        <FormLabel icon="🏙️" required>City</FormLabel>
                        <input
                            value={form.city}
                            onChange={(e) => update('city', e.target.value)}
                            placeholder="e.g. Mumbai"
                        />
                        {fieldHint('city')}
                    </label>
                </div>

                <div className="field-row">
                    <label className={fieldClass('district')}>
                        <FormLabel icon="📍" required>District</FormLabel>
                        <input
                            value={form.district}
                            onChange={(e) => update('district', e.target.value)}
                            placeholder="e.g. Pune"
                        />
                        {fieldHint('district')}
                    </label>
                    <label className={fieldClass('pincode')}>
                        <FormLabel icon="📮" required>Pincode</FormLabel>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={form.pincode}
                            onChange={(e) => update('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="6-digit PIN"
                        />
                        {fieldHint('pincode')}
                    </label>
                </div>

                <label className="field">
                    <FormLabel icon="🗺️">Venue / Landmark Details</FormLabel>
                    <textarea
                        value={form.location_details}
                        onChange={(e) => update('location_details', e.target.value)}
                        placeholder="Stadium name, landmark, directions..."
                        rows={2}
                    />
                </label>

                <label className={fieldClass('sports_category_id')}>
                    <FormLabel icon="🏅" required>Sport Category</FormLabel>
                    <select
                        value={form.sports_category_id}
                        onChange={(e) => update('sports_category_id', e.target.value)}
                        className="select"
                    >
                        <option value="">Select sport</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    {fieldHint('sports_category_id')}
                </label>

                <div className="field-row">
                    <label className={fieldClass('start_date')}>
                        <FormLabel icon="📅" required>Start Date</FormLabel>
                        <input
                            type="date"
                            value={form.start_date}
                            onChange={(e) => update('start_date', e.target.value)}
                        />
                        {fieldHint('start_date')}
                    </label>
                    <label className={fieldClass('winning_date')}>
                        <FormLabel icon="🏁" required>Winning Date</FormLabel>
                        <input
                            type="date"
                            value={form.winning_date}
                            onChange={(e) => update('winning_date', e.target.value)}
                        />
                        {fieldHint('winning_date')}
                    </label>
                </div>

                <div className="field-row">
                    <label className={fieldClass('slot_count')}>
                        <FormLabel icon="👥" required>Slots</FormLabel>
                        <input
                            type="number"
                            min="1"
                            value={form.slot_count}
                            onChange={(e) => update('slot_count', e.target.value)}
                        />
                        {fieldHint('slot_count')}
                    </label>
                    <label className={fieldClass('entry_fee')}>
                        <FormLabel icon="💰" required>Entry Fee (₹)</FormLabel>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.entry_fee}
                            onChange={(e) => update('entry_fee', e.target.value)}
                        />
                        {fieldHint('entry_fee')}
                    </label>
                </div>

                <label className={fieldClass('rules')}>
                    <FormLabel icon="📜" required>Rules</FormLabel>
                    <textarea
                        value={form.rules}
                        onChange={(e) => update('rules', e.target.value)}
                        placeholder="Tournament rules and regulations..."
                        rows={4}
                    />
                    {fieldHint('rules')}
                </label>

                <div className={fieldClass('template_file')}>
                    <FormLabel icon="📎" required>Tournament Template</FormLabel>
                    <div
                        className={`file-upload${templateFile ? ' has-file' : ''}${showFieldErrors && fieldErrors.template_file ? ' field-invalid' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={ACCEPTED_TEMPLATE_TYPES}
                            onChange={handleTemplateChange}
                            className="file-input-hidden"
                        />
                        {templateFile ? (
                            <>
                                <span className="file-upload-icon">✅</span>
                                <span className="file-upload-name">{templateFile.name}</span>
                                <span className="file-upload-hint">
                                    {(templateFile.size / 1024).toFixed(1)} KB — tap to change
                                </span>
                            </>
                        ) : (
                            <>
                                <span className="file-upload-icon">📤</span>
                                <span className="file-upload-name">Upload template</span>
                                <span className="file-upload-hint">PDF, DOC, DOCX, PNG, JPG (max 10 MB)</span>
                            </>
                        )}
                    </div>
                    {fieldHint('template_file')}
                </div>

                <label className="field">
                    <FormLabel icon="⚽">Ball Type</FormLabel>
                    <input
                        value={form.ball_type}
                        onChange={(e) => update('ball_type', e.target.value)}
                        placeholder="e.g. Tennis ball, Leather ball"
                    />
                </label>

                <button type="submit" className="btn btn-primary btn-block" disabled={loading || locating}>
                    {loading ? 'Creating...' : 'Create Tournament'}
                </button>
            </form>
        </div>
    );
}
