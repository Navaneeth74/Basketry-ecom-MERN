import React from 'react';

const InvoiceModal = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = order.invoiceNumber || `INV-${order._id?.substring(0, 8).toUpperCase()}`;
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const subtotal = order.totalAmount ? (order.totalAmount / 1.18) : 0;
  const tax = order.totalAmount ? (order.totalAmount - subtotal) : 0;

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Actions header (Hidden in print) */}
        <div className="no-print" style={headerActionsStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f97316' }}>Tax Invoice</span>
            <span style={badgeStyle}>{order.paymentStatus || 'Paid'}</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handlePrint} style={printBtnStyle}>
              🖨️ Print Invoice
            </button>
            <button onClick={onClose} style={closeBtnStyle}>
              ✕ Close
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div id="printable-invoice" style={invoiceSheetStyle}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e4e4e7', paddingBottom: '20px', marginBottom: '24px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#18181b', fontWeight: 800, letterSpacing: '-0.03em' }}>
                Basketry<span style={{ color: '#f97316' }}>.</span>
              </h1>
              <p style={{ margin: '4px 0 0', color: '#71717a', fontSize: '0.85rem' }}>
                Basketry Global Retail Ltd. • MNC E-Commerce Division
              </p>
              <p style={{ margin: '2px 0 0', color: '#a1a1aa', fontSize: '0.8rem' }}>
                GSTIN: 29AABCU9603R1ZM • Registered Retailer
              </p>
              <p style={{ margin: '2px 0 0', color: '#f97316', fontSize: '0.8rem', fontWeight: 600 }}>
                Lead Developer & Architect: Navaneeth S
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'inline-block', background: '#f4f4f5', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, color: '#27272a' }}>
                ORIGINAL TAX INVOICE
              </span>
              <p style={{ margin: '8px 0 0', fontSize: '1rem', fontWeight: 700, color: '#18181b' }}>
                {invoiceNumber}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#71717a' }}>
                Date: {orderDate}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#71717a' }}>
                Order ID: #{order._id?.substring(0, 10)}...
              </p>
            </div>
          </div>

          {/* Billed To & Shipping Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', background: '#fafafa', padding: '16px', borderRadius: '8px', border: '1px solid #f4f4f5' }}>
            <div>
              <h4 style={{ margin: '0 0 6px', fontSize: '0.85rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Billed To (Customer)
              </h4>
              <p style={{ margin: 0, fontWeight: 700, color: '#18181b', fontSize: '0.95rem' }}>
                {order.address?.fullName || order.userId?.name || 'Customer'}
              </p>
              <p style={{ margin: '4px 0 0', color: '#52525b', fontSize: '0.85rem', lineHeight: 1.5 }}>
                {order.address?.street}<br />
                {order.address?.city}, {order.address?.postalCode}<br />
                {order.address?.country}
              </p>
            </div>

            <div>
              <h4 style={{ margin: '0 0 6px', fontSize: '0.85rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Fulfillment & Payment
              </h4>
              <p style={{ margin: 0, color: '#52525b', fontSize: '0.85rem' }}>
                <strong>Payment Method:</strong> {order.paymentMethod || 'Razorpay Gateway'}
              </p>
              <p style={{ margin: '4px 0 0', color: '#52525b', fontSize: '0.85rem' }}>
                <strong>Payment ID:</strong> {order.paymentId || 'Verified / Captured'}
              </p>
              <p style={{ margin: '4px 0 0', color: '#52525b', fontSize: '0.85rem' }}>
                <strong>Carrier:</strong> {order.carrier || 'Basketry Express Logistics'}
              </p>
              <p style={{ margin: '4px 0 0', color: '#52525b', fontSize: '0.85rem' }}>
                <strong>Tracking:</strong> {order.trackingNumber || 'Pending Dispatch'}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
            <thead>
              <tr style={{ background: '#f4f4f5', borderBottom: '1px solid #e4e4e7' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.8rem', color: '#71717a' }}>#</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.8rem', color: '#71717a' }}>ITEM DESCRIPTION</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '0.8rem', color: '#71717a' }}>QTY</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '0.8rem', color: '#71717a' }}>UNIT PRICE</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '0.8rem', color: '#71717a' }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, index) => {
                const name = item.productId?.name || item.name || 'Basketry Merchandise';
                const price = item.price || 0;
                const qty = item.qty || 1;
                return (
                  <tr key={index} style={{ borderBottom: '1px solid #f4f4f5' }}>
                    <td style={{ padding: '12px', fontSize: '0.85rem', color: '#71717a' }}>{index + 1}</td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', color: '#18181b', fontWeight: 600 }}>{name}</td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', color: '#52525b', textAlign: 'center' }}>{qty}</td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', color: '#52525b', textAlign: 'right' }}>₹{price.toFixed(2)}</td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', color: '#18181b', fontWeight: 700, textAlign: 'right' }}>₹{(price * qty).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals Summary */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <div style={{ width: '260px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem', color: '#52525b' }}>
                <span>Subtotal (Net):</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem', color: '#52525b' }}>
                <span>Integrated GST (18%):</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem', color: '#52525b' }}>
                <span>Shipping & Handling:</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>FREE (Standard)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: '6px', borderTop: '2px solid #18181b', fontSize: '1.1rem', fontWeight: 800, color: '#18181b' }}>
                <span>Grand Total:</span>
                <span style={{ color: '#f97316' }}>₹{(order.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Legal Note */}
          <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: '16px', fontSize: '0.75rem', color: '#a1a1aa', textAlign: 'center' }}>
            <p style={{ margin: 0 }}>This is an electronically generated MNC Tax Invoice issued under Basketry E-Commerce Retail Systems.</p>
            <p style={{ margin: '4px 0 0' }}>Engineered & Developed by <strong>Navaneeth S</strong> for Web Technology: E-Commerce Admin & Order Management System.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const backdropStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.75)',
  backdropFilter: 'blur(5px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
  padding: '20px'
};

const modalStyle = {
  background: '#ffffff',
  borderRadius: '16px',
  maxWidth: '750px',
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
  display: 'flex',
  flexDirection: 'column'
};

const headerActionsStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 24px',
  background: '#18181b',
  borderTopLeftRadius: '16px',
  borderTopRightRadius: '16px'
};

const printBtnStyle = {
  background: '#f97316',
  color: '#ffffff',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.85rem'
};

const closeBtnStyle = {
  background: '#3f3f46',
  color: '#ffffff',
  border: 'none',
  padding: '8px 14px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.85rem'
};

const badgeStyle = {
  background: 'rgba(16,185,129,0.2)',
  color: '#10b981',
  padding: '3px 8px',
  borderRadius: '4px',
  fontSize: '0.75rem',
  fontWeight: 700
};

const invoiceSheetStyle = {
  padding: '32px 40px',
  color: '#18181b',
  background: '#ffffff'
};

export default InvoiceModal;
