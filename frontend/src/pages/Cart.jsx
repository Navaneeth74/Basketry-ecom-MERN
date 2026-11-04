import React, { useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { removeFromCart, addToCart } from '../redux/cartSlice';
import { CurrencyContext } from '../context/CurrencyContext';
import '../styles/cart.css';

const Cart = () => {
  const cartItems = useSelector((state) => state.cart.cartItems);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { formatPrice, currency } = useContext(CurrencyContext);

  const handleRemove = (id) => {
    dispatch(removeFromCart(id));
  };

  const handleUpdateQty = (item, qty) => {
    if (qty > 0) {
      if (item.stock && qty > item.stock) {
        alert(`Maximum available stock for ${item.name} is ${item.stock}`);
        return;
      }
      dispatch(addToCart({ ...item, qty }));
    }
  };

  const totalPrice = cartItems.reduce((acc, item) => acc + (item.price || 0) * (item.qty || 1), 0);

  return (
    <div className="cart-container" style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '2.2rem', color: '#fff', margin: 0, fontWeight: 800 }}>Shopping Cart</h2>
        <span style={{ color: '#a1a1aa', fontSize: '0.95rem' }}>
          {cartItems.length} unique item{cartItems.length === 1 ? '' : 's'}
        </span>
      </div>

      {cartItems.length === 0 ? (
        <div style={{ background: '#18181b', padding: '60px 20px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#a1a1aa', fontSize: '1.1rem', marginBottom: '20px' }}>Your shopping cart is currently empty.</p>
          <Link to="/shop" className="btn" style={{ padding: '12px 24px', fontSize: '1rem' }}>Browse Basketry Collection</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.productId} className="cart-item" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="cart-item-image"
                  style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';
                  }}
                />
                <div className="cart-item-details" style={{ flex: 1, paddingLeft: '16px' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem', color: '#fff' }}>{item.name}</h4>
                  <p style={{ margin: '0 0 12px', color: '#f97316', fontWeight: 700, fontSize: '1rem' }}>
                    {formatPrice(item.price)} each
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div className="qty-controls" style={{ display: 'flex', alignItems: 'center', background: '#09090b', borderRadius: '6px', border: '1px solid #27272a' }}>
                      <button
                        onClick={() => handleUpdateQty(item, item.qty - 1)}
                        style={{ background: 'transparent', border: 'none', color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: '1rem' }}
                      >
                        -
                      </button>
                      <span style={{ color: '#fff', fontWeight: 700, padding: '0 6px', minWidth: '24px', textAlign: 'center' }}>
                        {item.qty}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(item, item.qty + 1)}
                        style={{ background: 'transparent', border: 'none', color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: '1rem' }}
                      >
                        +
                      </button>
                    </div>
                    <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>
                      Subtotal: <strong style={{ color: '#fff' }}>{formatPrice(item.price * item.qty)}</strong>
                    </span>
                    <button onClick={() => handleRemove(item.productId)} className="btn-remove" style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary" style={{ background: '#18181b', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              Order Summary
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa', marginBottom: '8px', fontSize: '0.9rem' }}>
              <span>Items Total ({cartItems.reduce((sum, i) => sum + i.qty, 0)} items):</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa', marginBottom: '8px', fontSize: '0.9rem' }}>
              <span>Estimated Shipping:</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>FREE</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa', marginBottom: '16px', fontSize: '0.9rem' }}>
              <span>Currency:</span>
              <span style={{ color: '#f97316', fontWeight: 600 }}>{currency}</span>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>Total:</span>
              <span style={{ fontSize: '1.6rem', color: '#f97316', fontWeight: 900 }}>{formatPrice(totalPrice)}</span>
            </div>

            <button onClick={() => navigate('/checkout')} className="btn btn-checkout" style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 700 }}>
              Proceed to Checkout →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
