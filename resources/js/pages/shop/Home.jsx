import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import ProductCard from '../../components/shop/ProductCard';
import BannerCarousel from '../../components/shop/BannerCarousel';
import LoaderScreen from '../../components/LoaderScreen';
import { useModule } from '../../context/ModuleContext';

export default function ShopHome() {
    const navigate = useNavigate();
    const { switchModule } = useModule();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/shop/home')
            .then((res) => setData(res.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading || !data) return <LoaderScreen message="Loading store..." />;

    return (
        <div className="page shop-home">
            <section className="store-hero">
                <div className="store-hero-copy">
                    <p className="header-eyebrow" style={{ color: 'var(--primary)' }}>Keep Playing Store</p>
                    <h1 className="store-hero-title">Gear up. Play more.</h1>
                    <p className="text-muted">Shop sports essentials, then switch to Tournaments anytime with the same account.</p>
                    <div className="btn-row">
                        <button type="button" className="btn btn-primary" onClick={() => navigate('/shop/products')}>
                            Shop products
                        </button>
                        <button type="button" className="btn btn-outline" onClick={() => switchModule('tournaments')}>
                            Open tournaments
                        </button>
                    </div>
                </div>
                <button type="button" className="search-bar-btn" onClick={() => navigate('/search')}>
                    <span>🔍</span>
                    <span>Search products, brands...</span>
                </button>
            </section>

            <BannerCarousel banners={data.banners || []} />

            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">Categories</h2>
                    <Link to="/shop/products" className="link-muted">See all</Link>
                </div>
                <div className="category-scroll">
                    {(data.categories || []).map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            className="category-chip"
                            onClick={() => navigate(`/shop/products?category_id=${cat.id}`)}
                        >
                            <span className="category-chip-icon">{cat.icon || '🏷️'}</span>
                            <span>{cat.name}</span>
                        </button>
                    ))}
                </div>
            </section>

            <ProductRail title="Featured" products={data.featured_products} link="/shop/products?featured=1" />
            <ProductRail title="Popular" products={data.popular_products} link="/shop/products?popular=1" />
            <ProductRail title="New Arrivals" products={data.new_arrivals} link="/shop/products?new=1" />
            <ProductRail title="Flash Deals" products={data.flash_deals} link="/shop/products?flash_deal=1" deal />

            {(data.tournament_promo?.length > 0 || data.tournament_banners?.length > 0) && (
                <section className="section store-tournament-promo">
                    <div className="section-header">
                        <h2 className="section-title">Live tournaments</h2>
                        <button type="button" className="link-muted" onClick={() => switchModule('tournaments')}>
                            Switch to Tournaments →
                        </button>
                    </div>
                    {data.tournament_banners?.length > 0 && <BannerCarousel banners={data.tournament_banners} />}
                    <div className="card-list" style={{ marginTop: 12 }}>
                        {(data.tournament_promo || []).map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                className="promo-card"
                                onClick={() => navigate(`/tournaments/${t.id}`)}
                            >
                                <div>
                                    <strong>{t.team_name}</strong>
                                    <p className="text-muted">{t.city}{t.state ? `, ${t.state}` : ''}</p>
                                </div>
                                <span className="badge badge-info">₹{t.entry_fee}</span>
                            </button>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

function ProductRail({ title, products, link, deal }) {
    const navigate = useNavigate();
    if (!products?.length) return null;

    return (
        <section className="section">
            <div className="section-header">
                <h2 className="section-title">{title}</h2>
                <Link to={link} className="link-muted">See all</Link>
            </div>
            <div className="product-rail">
                {products.map((p) => (
                    <ProductCard key={p.id} product={p} deal={deal} onClick={() => navigate(`/shop/products/${p.id}`)} />
                ))}
            </div>
        </section>
    );
}
