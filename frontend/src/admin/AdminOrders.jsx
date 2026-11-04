import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import InvoiceModal from '../components/InvoiceModal';

const ORDER_STEPS = ['Placed', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

const getNextStatus = (status) => ({
  Pending: 'Confirmed',
  Placed: 'Confirmed',
  Confirmed: 'Processing',
  Processing: 'Shipped',
  Shipped: 'Out for Delivery',
  'Out for Delivery': 'Delivered'
}[status] || '');

const AdminOrders = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState('All');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [selectedAuditOrder, setSelectedAuditOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not load orders.');
      setOrders(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const updateStatus = async (id, status) => {
    setError('');
    setUpdatingOrderId(id);
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not update order status.');
      setOrders(prev => prev.map(o => o._id === id ? data : o));
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingOrderId('');
    }
  };

  const filteredOrders = orders.filter(order => {
    const status = order.status === 'Pending' ? 'Placed' : (order.status || 'Placed');
    const matchStatus = selectedStatusTab === 'All' || status === selectedStatusTab;
    const searchLower = search.toLowerCase();
    const matchSearch = (
      order._id.toLowerCase().includes(searchLower) ||
      (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchLower)) ||
      (order.invoiceNumber && order.invoiceNumber.toLowerCase().includes(searchLower)) ||
      (order.userId?.name && order.userId.name.toLowerCase().includes(searchLower)) ||
      (order.address?.fullName && order.address.fullName.toLowerCase().includes(searchLower)) ||
      (order.address?.city && order.address.city.toLowerCase().includes(searchLower))
    );
    return matchStatus && matchSearch;
  });

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div>
          <span style={{ color: '#f97316', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Fulfillment Lifecycle
          </span>
          <h2 style={{ color: '#fff', fontSize: '2rem', margin: '4px 0 0', fontWeight: 800 }}>
            Manage Customer Orders
          </h2>
        </div>

        <button
          onClick={fetchOrders}
          style={{ background: '#27272a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          🔄 Refresh Orders
        </button>
      </div>

      {error && <p role="alert" style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p>}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {['All', ...ORDER_STEPS].map(tab => (
          <button
            key={tab}
            onClick={() => setSelectedStatusTab(tab)}
            style={{
              background: selectedStatusTab === tab ? '#f97316' : '#27272a',
              color: selectedStatusTab === tab ? '#fff' : '#a1a1aa',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search by Order ID, Tracking #, Customer Name, or City..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '450px',
            background: '#09090b',
            border: '1px solid #27272a',
            padding: '10px 14px',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.9rem',
            outline: 'none'
          }}
        />
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr style={rowStyle}>
              <th style={thStyle}>ORDER / INVOICE</th>
              <th style={thStyle}>CUSTOMER</th>
              <th style={thStyle}>TOTAL</th>
              <th style={thStyle}>PAYMENT</th>
              <th style={thStyle}>TRACKING / CARRIER</th>
              <th style={thStyle}>STATUS PROGRESSION</th>
              <th style={thStyle}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={tdStyle}>Loading orders…</td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan="7" style={tdStyle}>No orders found.</td></tr>
            ) : filteredOrders.map(order => {
              const status = order.status === 'Pending' ? 'Placed' : (order.status || 'Placed');
              const nextStatus = getNextStatus(status);
              const unpaidRazorpayOrder = Boolean(order.razorpayOrderId) && order.paymentStatus !== 'Paid';

              return (
                <tr key={order._id} style={rowStyle}>
                  <td style={tdStyle}>
                    <strong style={{ color: '#fff', fontSize: '0.88rem', display: 'block' }}>
                      #{order._id.substring(0, 8)}...
                    </strong>
                    <span style={{ color: '#71717a', fontSize: '0.78rem' }}>
                      {order.invoiceNumber || 'INV-AUTO'} • {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: '#fff', fontWeight: 600, display: 'block' }}>
                      {order.address?.fullName || order.userId?.name || 'Customer'}
                    </span>
                    <span style={{ color: '#71717a', fontSize: '0.78rem' }}>
                      {order.address?.city || 'India'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <strong style={{ color: '#10b981' }}>₹{order.totalAmount.toFixed(2)}</strong>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      color: order.paymentStatus === 'Paid' ? '#10b981' : order.paymentStatus === 'Refunded' ? '#3b82f6' : '#f59e0b',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}>
                      {order.paymentStatus || 'Paid'}
                    </span>
                    <span style={{ display: 'block', color: '#71717a', fontSize: '0.72rem' }}>
                      {order.paymentMethod || 'Razorpay'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: '#f97316', fontWeight: 600, fontSize: '0.82rem', display: 'block' }}>
                      {order.trackingNumber || 'Pending Dispatch'}
                    </span>
                    <span style={{ color: '#71717a', fontSize: '0.75rem' }}>
                      {order.carrier || 'Basketry Logistics'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <select
                      value={status}
                      disabled={Boolean(updatingOrderId) || unpaidRazorpayOrder || !nextStatus}
                      title={unpaidRazorpayOrder ? 'Only paid orders can enter fulfillment' : ''}
                      onChange={(e) => updateStatus(order._id, e.target.value)}
                      style={{
                        background: '#09090b',
                        color: '#fff',
                        padding: '6px 10px',
                        border: '1px solid #27272a',
                        borderRadius: '6px',
                        outline: 'none',
                        fontSize: '0.85rem',
                        cursor: nextStatus ? 'pointer' : 'default'
                      }}
                    >
                      <option value={status}>Current: {status}</option>
                      {nextStatus && <option value={nextStatus}>Advance to: {nextStatus} →</option>}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => setSelectedAuditOrder(order)}
                        style={{
                          background: '#27272a',
                          color: '#fff',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          cursor: 'pointer'
                        }}
                      >
                        Audit
                      </button>
                      <button
                        onClick={() => setSelectedInvoiceOrder(order)}
                        style={{
                          background: '#3f3f46',
                          color: '#fff',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          cursor: 'pointer'
                        }}
                      >
                        Invoice
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedInvoiceOrder && (
        <InvoiceModal order={selectedInvoiceOrder} onClose={() => setSelectedInvoiceOrder(null)} />
      )}

      {/* Audit Log Modal */}
      {selectedAuditOrder && (
        <div style={auditBackdrop} onClick={() => setSelectedAuditOrder(null)}>
          <div style={auditModal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #27272a', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff' }}>Order Audit Trail</h3>
                <span style={{ color: '#71717a', fontSize: '0.8rem' }}>Order ID: #{selectedAuditOrder._id}</span>
              </div>
              <button onClick={() => setSelectedAuditOrder(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '50vh', overflowY: 'auto' }}>
              {(selectedAuditOrder.statusHistory || []).map((h, i) => (
                <div key={i} style={{ background: '#09090b', padding: '12px', borderRadius: '8px', border: '1px solid #27272a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: '#f97316', fontSize: '0.9rem' }}>{h.status}</strong>
                    <span style={{ color: '#71717a', fontSize: '0.75rem' }}>{new Date(h.changedAt).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: '2px 0 0', color: '#a1a1aa', fontSize: '0.82rem' }}>
                    Location: <strong style={{ color: '#fff' }}>{h.location || 'Fulfillment Facility'}</strong>
                  </p>
                  {h.note && <p style={{ margin: '2px 0 0', color: '#71717a', fontSize: '0.8rem' }}>Note: {h.note}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const containerStyle = { maxWidth: '1200px', margin: '40px auto', padding: '30px', background: '#18181b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', color: '#fafafa' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const rowStyle = { borderBottom: '1px solid rgba(255,255,255,0.08)' };
const thStyle = { padding: '14px 12px', textAlign: 'left', color: '#a1a1aa', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em' };
const tdStyle = { padding: '14px 12px', textAlign: 'left' };

const auditBackdrop = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.8)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
  padding: '20px'
};

const auditModal = {
  background: '#18181b',
  borderRadius: '14px',
  padding: '24px',
  maxWidth: '560px',
  width: '100%',
  border: '1px solid rgba(255,255,255,0.1)'
};

export default AdminOrders;
