import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/cartSlice';
import { CurrencyContext } from '../context/CurrencyContext';
import '../styles/product.css';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const { formatPrice } = useContext(CurrencyContext);

  const isOutOfStock = product.stock === 0;
  const isLowStock = !isOutOfStock && product.stock <= (product.lowStockThreshold || 5);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (isOutOfStock) return;
    dispatch(addToCart({
      productId: product._id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      stock: product.stock,
      qty: 1
    }));
  };

  return (
    <article className="product-card" style={{ position: 'relative' }}>
      {/* Stock Health Badge */}
      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}>
        {isOutOfStock ? (
          <span style={{
            background: 'rgba(239, 68, 68, 0.9)',
            color: '#fff',
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            Out of Stock
          </span>
        ) : isLowStock ? (
          <span style={{
            background: 'rgba(245, 158, 11, 0.9)',
            color: '#fff',
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '4px'
          }}>
            Only {product.stock} left
          </span>
        ) : (
          <span style={{
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#10b981',
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '4px'
          }}>
            In Stock
          </span>
        )}
      </div>

      <Link to={`/product/${product._id}`} className="product-image-link" aria-label={`View ${product.name}`}>
        <img
          src={product.imageUrl}
          alt={product.name}
          className="product-image"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';
          }}
        />
      </Link>

      <div className="product-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{
            fontSize: '0.75rem',
            color: '#f97316',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {product.category || 'General'}
          </span>
          <span style={{ fontSize: '0.8rem', color: '#fbbf24' }}>
            ★ {product.ratings ? product.ratings.toFixed(1) : '4.5'}
          </span>
        </div>

        <h3 title={product.name} style={{
          fontSize: '1rem',
          margin: '0 0 8px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {product.name}
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <p className="price" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f97316' }}>
            {formatPrice(product.price)}
          </p>

          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            style={{
              background: isOutOfStock ? '#3f3f46' : '#27272a',
              color: isOutOfStock ? '#71717a' : '#fafafa',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (!isOutOfStock) e.currentTarget.style.background = '#f97316';
            }}
            onMouseOut={(e) => {
              if (!isOutOfStock) e.currentTarget.style.background = '#27272a';
            }}
          >
            {isOutOfStock ? 'Sold Out' : '+ Cart'}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
