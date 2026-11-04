import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import InvoiceModal from '../components/InvoiceModal';

const OrderSuccess = () => {
  const location = useLocation();
  const order = location.state?.order;
  const [showInvoice, setShowInvoice] = useState(false);

  const containerStyle = {
    maxWidth: '680px',
    margin: '60px auto',
    padding: '48px 36px',
    background: '#18181b',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    textAlign: 'center'
  };

  return (
    <div style={containerStyle}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'rgba(16,185,129,0.15)',
        color: '#10b981',
        display: 'grid',
        placeItems: 'center',
        fontSize: '2rem',
        margin: '0 auto 20px'
      }}>
        ✓
      </div>

      <h2 style={{ fontSize: '2.4rem', margin: '0 0 12px', color: '#fff', fontWeight: 800 }}>
        Payment & Order Confirmed!
      </h2>

      <p style={{ color: '#a1a1aa', fontSize: '1.05rem', lineHeight: 1.6, margin: '0 0 28px' }}>
        Thank you for shopping with Basketry. Your order has entered our automated warehouse fulfillment queue.
      </p>

      {order && (
        <div style={{
          background: '#09090b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'left',
          marginBottom: '32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px'
        }}>
          <div>
            <span style={{ color: '#71717a', fontSize: '0.8rem', textTransform: 'uppercase' }}>Order ID</span>
            <p style={{ margin: '4px 0 0', color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
              #{order._id?.substring(0, 12)}...
            </p>
          </div>

          <div>
            <span style={{ color: '#71717a', fontSize: '0.8rem', textTransform: 'uppercase' }}>Tracking Number</span>
            <p style={{ margin: '4px 0 0', color: '#f97316', fontWeight: 700, fontSize: '0.9rem' }}>
              {order.trackingNumber || 'BSK-TRK-PENDING'}
            </p>
          </div>

          <div>
            <span style={{ color: '#71717a', fontSize: '0.8rem', textTransform: 'uppercase' }}>Invoice Number</span>
            <p style={{ margin: '4px 0 0', color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
              {order.invoiceNumber || 'INV-2026-AUTO'}
            </p>
          </div>

          <div>
            <span style={{ color: '#71717a', fontSize: '0.8rem', textTransform: 'uppercase' }}>Carrier</span>
            <p style={{ margin: '4px 0 0', color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>
              {order.carrier || 'Basketry Express'}
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {order?._id && (
          <Link
            to={`/track/${order._id}`}
            className="btn"
            style={{ padding: '12px 24px', fontSize: '0.95rem' }}
          >
            🚚 Live Track Delivery
          </Link>
        )}

        {order && (
          <button
            onClick={() => setShowInvoice(true)}
            style={{
              background: '#27272a',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '12px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem'
            }}
          >
            📄 View Tax Invoice
          </button>
        )}

        <Link
          to="/shop"
          style={{
            background: 'transparent',
            color: '#a1a1aa',
            border: 'none',
            padding: '12px 20px',
            textDecoration: 'none',
            fontSize: '0.95rem',
            display: 'inline-flex',
            alignItems: 'center'
          }}
        >
          Continue Shopping →
        </Link>
      </div>

      {showInvoice && order && (
        <InvoiceModal order={order} onClose={() => setShowInvoice(false)} />
      )}
    </div>
  );
};

export default OrderSuccess;
