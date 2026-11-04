import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useSelector } from 'react-redux';
import '../styles/navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const cartItems = useSelector((state) => state.cart.cartItems);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const totalItemsCount = cartItems.reduce((acc, item) => acc + (item.qty || 1), 0);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img
            src="/Basketrylogo.png"
            alt="Basketry Logo"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://cdn-icons-png.flaticon.com/512/3514/3514491.png';
            }}
            style={{ width: '34px', height: '34px', borderRadius: '8px', objectFit: 'contain' }}
          />
          <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
            basketry<span style={{ color: '#f97316' }}>.</span>
          </span>
        </Link>
      </div>

      <ul className="navbar-links">
        <li>
          <Link to="/shop">Shop</Link>
        </li>
        <li>
          <Link to="/track" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>🚚</span> Track Order
          </Link>
        </li>
        <li>
          <Link to="/cart" className="navbar-cart" aria-label={`Shopping cart, ${totalItemsCount} items`}>
            Cart <span className="cart-count">{totalItemsCount}</span>
          </Link>
        </li>

        {user ? (
          <>
            <li>
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'rgba(249,115,22,0.2)',
                  color: '#f97316',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
                <span>{user.name.split(' ')[0]}</span>
              </Link>
            </li>
            {user.role === 'admin' && (
              <li>
                <Link to="/admin" style={{
                  background: 'rgba(249,115,22,0.15)',
                  color: '#f97316',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}>
                  ⚡ Admin
                </Link>
              </li>
            )}
            <li>
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li><Link to="/login">Login</Link></li>
            <li>
              <Link to="/register" style={{
                background: '#f97316',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}>
                Sign Up
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
