import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/cartSlice';
import { CurrencyContext } from '../context/CurrencyContext';
import '../styles/product.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedMessage, setAddedMessage] = useState(false);
  const dispatch = useDispatch();
  const { formatPrice } = useContext(CurrencyContext);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        setProduct(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product && product.stock > 0) {
      dispatch(addToCart({
        productId: product._id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        stock: product.stock,
        qty: quantity
      }));
      setAddedMessage(true);
      setTimeout(() => setAddedMessage(false), 3000);
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', margin: '100px 0', color: '#f97316', fontSize: '1.2rem' }}>
      Loading product details…
    </div>
  );

  if (!product) return (
    <div style={{ textAlign: 'center', margin: '100px 0', color: '#ef4444', fontSize: '1.2rem' }}>
      Product Not Found. <Link to="/shop" style={{ color: '#f97316' }}>Return to shop</Link>
    </div>
  );

  const isOutOfStock = product.stock === 0;
  const isLowStock = !isOutOfStock && product.stock <= (product.lowStockThreshold || 5);

  return (
    <div className="product-detail-wrapper" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ color: '#71717a', marginBottom: '24px', fontSize: '0.9rem' }}>
        <Link to="/" style={{ color: '#a1a1aa', textDecoration: 'none' }}>Home</Link> /{' '}
        <Link to="/shop" style={{ color: '#a1a1aa', textDecoration: 'none' }}>Shop</Link> /{' '}
        <span style={{ color: '#f97316' }}>{product.category}</span> /{' '}
        <span style={{ color: '#fff' }}>{product.name}</span>
      </div>

      <div className="product-detail" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '40px',
        background: '#18181b',
        padding: 'clamp(20px, 4vw, 40px)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.06)'
      }}>
        {/* Left Side: Image */}
        <div className="detail-image-container" style={{ position: 'relative' }}>
          <img
            src={product.imageUrl}
            alt={product.name}
            className="detail-image"
            style={{
              width: '100%',
              maxHeight: '480px',
              objectFit: 'cover',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';
            }}
          />
        </div>

        {/* Right Side: Information Block */}
        <div className="detail-info" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{
              background: 'rgba(249,115,22,0.15)',
              color: '#f97316',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>
              {product.category}
            </span>
            <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>
              SKU: <strong style={{ color: '#fff' }}>{product.sku || 'BSK-SKU-001'}</strong>
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', margin: '0 0 12px', color: '#fff', fontWeight: 800 }}>
            {product.name}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ color: '#fbbf24', fontSize: '1rem', fontWeight: 700 }}>
              ★ {product.ratings ? product.ratings.toFixed(1) : '4.8'}
            </span>
            <span style={{ color: '#71717a', fontSize: '0.85rem' }}>
              ({product.numReviews || 18} verified MNC reviews)
            </span>
            <span style={{ color: '#71717a' }}>•</span>
            <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>
              Brand: <strong>{product.brand || 'Basketry Studio'}</strong>
            </span>
          </div>

          {/* Price */}
          <div style={{ margin: '8px 0 20px', padding: '16px 20px', background: '#09090b', borderRadius: '10px', border: '1px solid #27272a' }}>
            <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>Price:</span>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#f97316' }}>
              {formatPrice(product.price)}
            </div>
            <p style={{ margin: '4px 0 0', color: '#71717a', fontSize: '0.8rem' }}>
              Taxes included. Standard shipping calculated at checkout.
            </p>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ color: '#fff', margin: '0 0 8px', fontSize: '1rem' }}>Overview</h4>
            <p style={{ color: '#a1a1aa', lineHeight: 1.7, margin: 0, fontSize: '0.95rem' }}>
              {product.description}
            </p>
          </div>

          {/* Stock Notification */}
          <div style={{ marginBottom: '20px' }}>
            {isOutOfStock ? (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', fontSize: '0.9rem', fontWeight: 600 }}>
                ● Out of Stock. Our warehouse team has scheduled restocking.
              </div>
            ) : isLowStock ? (
              <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.15)', border: '1px solid #f59e0b', borderRadius: '8px', color: '#f59e0b', fontSize: '0.9rem', fontWeight: 600 }}>
                ⚡ Low Stock: Only {product.stock} units remaining in the central warehouse!
              </div>
            ) : (
              <div style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 600 }}>
                ● In Stock ({product.stock} units ready for immediate dispatch)
              </div>
            )}
          </div>

          {/* Quantity Selector & Add to Cart */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '20px' }}>
            {!isOutOfStock && (
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #27272a', borderRadius: '8px', background: '#09090b' }}>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ background: 'transparent', border: 'none', color: '#fff', padding: '10px 16px', cursor: 'pointer', fontSize: '1.1rem' }}
                >
                  -
                </button>
                <span style={{ padding: '0 8px', color: '#fff', fontWeight: 700, fontSize: '1rem', minWidth: '30px', textAlign: 'center' }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  style={{ background: 'transparent', border: 'none', color: '#fff', padding: '10px 16px', cursor: 'pointer', fontSize: '1.1rem' }}
                >
                  +
                </button>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="btn"
              style={{
                flex: 1,
                padding: '14px 24px',
                fontSize: '1rem',
                fontWeight: 700,
                opacity: isOutOfStock ? 0.5 : 1,
                cursor: isOutOfStock ? 'not-allowed' : 'pointer'
              }}
            >
              {isOutOfStock ? 'Temporarily Sold Out' : `Add ${quantity > 1 ? `${quantity} items` : 'to Cart'}`}
            </button>
          </div>

          {addedMessage && (
            <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', borderRadius: '8px', color: '#10b981', fontSize: '0.9rem', marginBottom: '16px' }}>
              ✓ Item added to cart! <Link to="/cart" style={{ color: '#fff', fontWeight: 700, marginLeft: '8px' }}>View Cart →</Link>
            </div>
          )}

          {/* Logistics Promise */}
          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem', color: '#71717a' }}>
            <div>🚚 Dispatches in 24 hrs via Basketry Logistics</div>
            <div>🛡️ 100% Verified Quality Guarantee</div>
            <div>🔁 7-Day Hassle-Free Returns</div>
            <div>📄 Instant Downloadable Tax Invoice</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
