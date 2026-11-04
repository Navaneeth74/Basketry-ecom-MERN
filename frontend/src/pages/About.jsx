import React from 'react';

const About = () => {
  return (
    <div style={{ maxWidth: '960px', margin: '40px auto', padding: '0 20px 80px' }}>
      {/* Hero Header */}
      <section style={cardStyle}>
        <span style={{
          display: 'inline-block',
          marginBottom: '12px',
          color: '#f97316',
          fontSize: '0.8rem',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase'
        }}>
          Web Technology • Course Project
        </span>
        <h1 style={{
          margin: '0 0 16px',
          color: '#fff',
          fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
          fontWeight: 800,
          letterSpacing: '-0.04em'
        }}>
          Basketry E-Commerce & Order Management System
        </h1>
        <p style={{
          color: '#d4d4d8',
          fontSize: '1.15rem',
          lineHeight: 1.7,
          margin: '0 0 24px'
        }}>
          Engineered & Developed by <strong>Navaneeth S</strong>. Designed to meet modern enterprise retail specifications for centralising product catalogs, processing secure payments, tracking warehouse-to-doorstep fulfillment, and generating automated business analytics.
        </p>

        <div style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '20px'
        }}>
          <div>
            <span style={{ color: '#71717a', fontSize: '0.8rem', textTransform: 'uppercase' }}>Lead Developer</span>
            <p style={{ margin: '2px 0 0', color: '#fff', fontWeight: 700 }}>Navaneeth S</p>
          </div>
          <div style={{ marginLeft: 'clamp(10px, 3vw, 40px)' }}>
            <span style={{ color: '#71717a', fontSize: '0.8rem', textTransform: 'uppercase' }}>System Architecture</span>
            <p style={{ margin: '2px 0 0', color: '#fff', fontWeight: 700 }}>MERN Stack (MongoDB, Express, React, Node.js)</p>
          </div>
          <div style={{ marginLeft: 'clamp(10px, 3vw, 40px)' }}>
            <span style={{ color: '#71717a', fontSize: '0.8rem', textTransform: 'uppercase' }}>Market Target</span>
            <p style={{ margin: '2px 0 0', color: '#10b981', fontWeight: 700 }}>2026 Enterprise Ready</p>
          </div>
        </div>
      </section>

      {/* Developer Card */}
      <div style={{
        marginTop: '40px',
        padding: '30px',
        background: '#09090b',
        borderRadius: '16px',
        border: '1px solid #27272a',
        textAlign: 'center'
      }}>
        <h3 style={{ margin: '0 0 8px', color: '#fff', fontSize: '1.3rem' }}>
          Developed by Navaneeth S
        </h3>
        <p style={{ color: '#a1a1aa', margin: '0 0 16px', fontSize: '0.95rem' }}>
          Basketry • Web Technology E-Commerce Admin & Order Management System
        </p>
        <span style={{
          display: 'inline-block',
          background: 'rgba(249, 115, 22, 0.1)',
          color: '#f97316',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: 700
        }}>
          MongoDB • Express • React • Node.js • Third-Party APIs
        </span>
      </div>
    </div>
  );
};

const cardStyle = {
  padding: 'clamp(28px, 6vw, 48px)',
  background: '#18181b',
  borderRadius: '20px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 18px 50px rgba(0,0,0,0.3)'
};

export default About;
