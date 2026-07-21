export default function ProductCard({ product, onClick, deal }) {
    const price = product.effective_price ?? product.price;
    const showStrike = Number(price) < Number(product.price);

    return (
        <button type="button" className={`product-card${deal ? ' deal' : ''}`} onClick={onClick}>
            <div className="product-card-img-wrap">
                {product.primary_image_url ? (
                    <img src={product.primary_image_url} alt={product.name} className="product-card-img" loading="lazy" />
                ) : (
                    <div className="product-card-img placeholder">🛍️</div>
                )}
                {deal && <span className="deal-badge">Deal</span>}
            </div>
            <div className="product-card-body">
                <p className="product-card-brand">{product.brand || product.category?.name}</p>
                <h3 className="product-card-name">{product.name}</h3>
                <div className="product-card-price-row">
                    <span className="price">₹{Number(price).toLocaleString()}</span>
                    {showStrike && <span className="price-strike">₹{Number(product.price).toLocaleString()}</span>}
                </div>
                {product.rating > 0 && (
                    <p className="product-card-rating">★ {Number(product.rating).toFixed(1)}</p>
                )}
            </div>
        </button>
    );
}
