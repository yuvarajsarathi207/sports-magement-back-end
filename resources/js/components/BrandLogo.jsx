/** Fast Keep Playing logo — small WebP/PNG instead of full 1254px JPEG. */
export default function BrandLogo({
    className = 'site-brand-logo',
    size = 128,
    alt = 'Keep Playing',
    priority = false,
}) {
    const png = size <= 64 ? '/icons/logo-64.png' : size <= 128 ? '/icons/logo-128.png' : '/icons/logo-192.png';
    const webp = size <= 64 ? '/icons/logo-64.webp' : '/icons/logo-128.webp';

    return (
        <picture>
            {size <= 128 && <source srcSet={webp} type="image/webp" />}
            <img
                src={png}
                alt={alt}
                className={className}
                width={size <= 64 ? 64 : 128}
                height={size <= 64 ? 64 : 128}
                decoding="async"
                fetchPriority={priority ? 'high' : 'auto'}
                loading={priority ? 'eager' : 'lazy'}
            />
        </picture>
    );
}
