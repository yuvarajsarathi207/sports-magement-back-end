import { Link, useNavigate } from 'react-router-dom';
import { LEGAL_BUSINESS, LEGAL_PLATFORM_URL } from './legalConstants';

const LEGAL_LINKS = [
    { to: '/terms', label: 'Terms & Conditions', id: 'terms' },
    { to: '/privacy', label: 'Privacy Policy', id: 'privacy' },
    { to: '/refund-policy', label: 'No Refund Policy', id: 'refund' },
];

export default function LegalPageLayout({ title, active, children }) {
    const navigate = useNavigate();

    return (
        <div className="page legal-page">
            <button type="button" className="back-btn" onClick={() => navigate(-1)}>← Back</button>

            <header className="legal-page-header">
                <h1 className="legal-page-title">{title}</h1>
                <p className="legal-page-meta">
                    Platform:{' '}
                    <a href={LEGAL_PLATFORM_URL} target="_blank" rel="noopener noreferrer">
                        {LEGAL_PLATFORM_URL}
                    </a>
                </p>
            </header>

            <nav className="legal-nav" aria-label="Legal documents">
                {LEGAL_LINKS.map((link) => (
                    <Link
                        key={link.id}
                        to={link.to}
                        className={`legal-nav-link${active === link.id ? ' is-active' : ''}`}
                    >
                        {link.label}
                    </Link>
                ))}
            </nav>

            <div className="legal-body">{children}</div>

            <aside className="legal-contact-card">
                <h2 className="legal-contact-title">Business contact</h2>
                <dl className="legal-contact-list">
                    <div>
                        <dt>Business name</dt>
                        <dd>{LEGAL_BUSINESS.name}</dd>
                    </div>
                    <div>
                        <dt>Email</dt>
                        <dd>
                            <a href={`mailto:${LEGAL_BUSINESS.email}`}>{LEGAL_BUSINESS.email}</a>
                        </dd>
                    </div>
                    <div>
                        <dt>Mobile</dt>
                        <dd>
                            <a href={`tel:${LEGAL_BUSINESS.phone}`}>{LEGAL_BUSINESS.phone}</a>
                        </dd>
                    </div>
                    <div>
                        <dt>Address</dt>
                        <dd>{LEGAL_BUSINESS.address}</dd>
                    </div>
                </dl>
            </aside>
        </div>
    );
}
