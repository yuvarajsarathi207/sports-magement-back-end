import { useNavigate } from 'react-router-dom';

export default function ProductCard({ product, basePath = '/shop' }) {
    const navigate = useNavigate();
    const image = product.images?.find((i) => i.is_primary)?.url
        || product.images?.[0]?.url
        || null;
    const variant = product.variants?.[0];
    const price = variant
        ? (variant.discount_price > 0 ? variant.discount_price : variant.price)
        : (product.discount_price > 0 ? product.discount_price : product.base_price);
    const compare = variant?.price || product.base_price;

    return (
        <button
            type="button"
            className="product-card"
            onClick={() => navigate(`${basePath}/products/${product.id}`)}
        >
            <div className="product-card-media">
                {image ? (
                    <img src={image} alt={product.name} loading="lazy" />
                ) : (
                    <div className="product-card-placeholder">🛒</div>
                )}
            </div>
            <div className="product-card-body">
                <p className="product-card-brand">{product.brand?.name || product.category?.name || 'Sports'}</p>
                <h3 className="product-card-title">{product.name}</h3>
                <div className="product-card-price-row">
                    <span className="product-card-price">₹{Number(price || 0).toLocaleString()}</span>
                    {compare > price && (
                        <span className="product-card-compare">₹{Number(compare).toLocaleString()}</span>
                    )}
                </div>
            </div>
        </button>
    );
}
