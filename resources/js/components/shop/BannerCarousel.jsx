import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BannerCarousel({ banners = [] }) {
    const [index, setIndex] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        if (banners.length < 2) return undefined;
        const id = setInterval(() => setIndex((i) => (i + 1) % banners.length), 4000);
        return () => clearInterval(id);
    }, [banners.length]);

    if (!banners.length) return null;

    const banner = banners[index] || banners[0];

    const go = () => {
        if (!banner.redirect_link) return;
        if (banner.redirect_link.startsWith('http')) {
            window.open(banner.redirect_link, '_blank');
            return;
        }
        const path = banner.redirect_link.replace(/^\/app/, '');
        navigate(path || '/');
    };

    return (
        <div className="banner-carousel">
            <button type="button" className="banner-slide" onClick={go}>
                <img src={banner.image_url || banner.image} alt={banner.title} />
                <div className="banner-caption">
                    <h3>{banner.title}</h3>
                    {banner.subtitle && <p>{banner.subtitle}</p>}
                </div>
            </button>
            {banners.length > 1 && (
                <div className="banner-dots">
                    {banners.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            className={`banner-dot${i === index ? ' active' : ''}`}
                            aria-label={`Slide ${i + 1}`}
                            onClick={() => setIndex(i)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
