import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { CurrencyContext } from '../context/CurrencyContext';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(Array.isArray(data) ? data.slice(0, 4) : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="home-container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 20px 60px' }}>
      {/* Hero Banner */}
      <div className="hero-banner" style={{
        marginTop: '24px',
        padding: 'clamp(40px, 8vw, 80px) clamp(24px, 5vw, 60px)',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="hero-copy" style={{ maxWidth: '680px', position: 'relative', zIndex: 1 }}>
          <span className="hero-tag" style={{
            display: 'inline-block',
            background: 'rgba(249, 115, 22, 0.15)',
            color: '#f97316',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.82rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '16px'
          }}>
            Next-Gen E-Commerce Platform
          </span>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 6vw, 3.8rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.04em',
            color: '#ffffff',
            margin: '0 0 16px'
          }}>
            Good finds.<br />
            <span style={{ color: '#f97316' }}>Great feeling.</span>
          </h1>

          <div className="hero-actions" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <Link to="/shop" className="hero-button" style={{
              background: '#f97316',
              color: '#fff',
              padding: '14px 28px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '1rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              Explore Collection <span aria-hidden="true">→</span>
            </Link>

            <Link to="/track" style={{
              background: '#27272a',
              color: '#fafafa',
              padding: '14px 24px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '1rem',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              🚚 Track a Package
            </Link>

            <Link to="/about" className="hero-link" style={{
              color: '#d4d4d8',
              padding: '14px 16px',
              fontWeight: 500,
              fontSize: '1rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center'
            }}>
              System Architecture →
            </Link>
          </div>
        </div>
      </div>

      {/* Enterprise Capabilities Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        margin: '36px 0 48px'
      }}>
        <div style={featureCardStyle}>
          <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>⚡</div>
          <h4 style={{ margin: '0 0 6px', color: '#fff', fontSize: '1rem' }}>Instant Verification</h4>
          <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.85rem', lineHeight: 1.5 }}>
            Cryptographically secure checkout with automated payment confirmation and rollback.
          </p>
        </div>

        <div style={featureCardStyle}>
          <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📍</div>
          <h4 style={{ margin: '0 0 6px', color: '#fff', fontSize: '1rem' }}>End-to-End Tracking</h4>
          <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.85rem', lineHeight: 1.5 }}>
            Real-time fulfillment stages from warehouse shelf to customer doorstep.
          </p>
        </div>

        <div style={featureCardStyle}>
          <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📊</div>
          <h4 style={{ margin: '0 0 6px', color: '#fff', fontSize: '1rem' }}>Automated Analytics</h4>
          <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.85rem', lineHeight: 1.5 }}>
            Visual sales charts, category breakdown, and 1-click MNC CSV audits.
          </p>
        </div>

        <div style={featureCardStyle}>
          <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📦</div>
          <h4 style={{ margin: '0 0 6px', color: '#fff', fontSize: '1rem' }}>Inventory Integrity</h4>
          <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.85rem', lineHeight: 1.5 }}>
            Centralised catalog with low stock triggers and 3rd-party supplier sync.
          </p>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="section-heading" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '24px'
      }}>
        <div>
          <span className="section-eyebrow" style={{
            color: '#f97316',
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            Curated Picks
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '4px 0 0', color: '#fff' }}>
            Featured Products
          </h2>
        </div>
        <Link to="/shop" className="section-link" style={{ color: '#f97316', fontWeight: 600, textDecoration: 'none' }}>
          View all products <span aria-hidden="true">→</span>
        </Link>
      </div>

      {loading ? (
        <div className="empty-state" role="status" style={{ textAlign: 'center', padding: '40px 0', color: '#f97316' }}>
          Loading products…
        </div>
      ) : products.length > 0 ? (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <div className="empty-state">No products found.</div>
      )}

      {/* Developer Banner */}
      <div style={{
        marginTop: '60px',
        padding: '30px',
        background: '#18181b',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div>
          <span style={{ color: '#f97316', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Author & System Architect
          </span>
          <h3 style={{ margin: '6px 0 4px', color: '#fff', fontSize: '1.4rem' }}>
            Navaneeth S
          </h3>
          <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.9rem' }}>
            Web Technology • E-Commerce Admin & Order Management System • Basketry 2026
          </p>
        </div>
        <Link to="/about" className="btn" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
          Explore Project Details
        </Link>
      </div>
    </div>
  );
};

const featureCardStyle = {
  background: '#18181b',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: '14px',
  padding: '24px 20px'
};

export default Home;
