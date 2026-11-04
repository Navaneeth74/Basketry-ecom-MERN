import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link to="/" style={{ textDecoration: 'none', color: '#fff', fontSize: '1.4rem', fontWeight: 800 }}>
            basketry<span style={{ color: '#f97316' }}>.</span>
          </Link>
          <p style={{ margin: '8px 0 0', color: '#a1a1aa', fontSize: '0.9rem' }}>
            A modern real-time E-Commerce Admin & Order Management System.
          </p>
          <p style={{ margin: '4px 0 0', color: '#f97316', fontSize: '0.85rem', fontWeight: 600 }}>
            Lead Developer: Navaneeth S
          </p>
        </div>

        <div className="footer-links">
          <Link to="/shop">Shop Catalog</Link>
          <Link to="/track">Track Shipment</Link>
          <Link to="/about">About & Architecture</Link>
          <Link to="/return">Returns & Refunds</Link>
          <Link to="/disclaimer">System Disclaimer</Link>
        </div>

        <div style={{ textAlign: 'right' }}>
          <p className="footer-copyright" style={{ margin: 0 }}>
            &copy; {new Date().getFullYear()} Basketry. All rights reserved.
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#71717a' }}>
            Built with MERN Stack • Third-Party APIs • Real-Time Order Lifecycle
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
