import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CurrencyContext } from '../context/CurrencyContext';
import { useNavigate, Link } from 'react-router-dom';
import InvoiceModal from '../components/InvoiceModal';

const ORDER_STATUS_STEPS = [
  'Placed',
  'Confirmed',
  'Processing',
  'Shipped',
  'Out for Delivery',
  'Delivered'
];

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const { formatPrice } = useContext(CurrencyContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const fetchMyOrders = async () => {
      try {
        const res = await fetch('/api/orders/myorders', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setOrders(Array.isArray(data) ? data : []);
        } else {
          if (res.status === 401) {
            logout();
            navigate('/login');
          }
          setOrders([]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyOrders();
  }, [user, navigate, logout]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const containerStyle = {
    maxWidth: '1050px',
    margin: '40px auto',
    padding: '30px',
    background: '#18181b',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#fafafa'
  };

  if (!user) return null;

  return (
    <div style={containerStyle}>
      {/* Profile Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '28px', marginBottom: '32px' }}>
        <div>
          <span style={{ color: '#f97316', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Customer Account
          </span>
          <h2 style={{ color: '#fff', fontSize: '2.2rem', margin: '4px 0 10px', fontWeight: 800 }}>
            {user.name}
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: '1rem', margin: '0 0 12px' }}>
            {user.email}
          </p>
          <span style={{
            background: user.role === 'admin' ? 'rgba(249,115,22,0.15)' : 'rgba(16,185,129,0.15)',
            color: user.role === 'admin' ? '#f97316' : '#10b981',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 700
          }}>
            {user.role === 'admin' ? 'ADMINISTRATOR' : 'VERIFIED CUSTOMER'}
          </span>
        </div>
        <button onClick={handleLogout} className="btn" style={{ background: '#ef4444', boxShadow: 'none', padding: '10px 20px', fontSize: '0.9rem' }}>
          Sign Out
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: '#f97316', margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Order History & Delivery Status</h3>
        <Link to="/track" style={{ color: '#a1a1aa', fontSize: '0.88rem', textDecoration: 'none' }}>
          🚚 Global Shipment Tracker →
        </Link>
      </div>

      {loading ? (
        <p style={{ color: '#a1a1aa' }}>Fetching your orders...</p>
      ) : orders.length === 0 ? (
        <div style={{ background: '#09090b', padding: '40px 20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #27272a' }}>
          <p style={{ color: '#a1a1aa', marginBottom: '16px' }}>You haven't placed any orders yet.</p>
          <Link to="/shop" className="btn">Start Shopping</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {orders.map((order) => {
            const currentStatus = order.status === 'Pending' ? 'Placed' : (order.status || 'Placed');
            const currentIndex = ORDER_STATUS_STEPS.indexOf(currentStatus);
            const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];

            return (
              <div key={order._id} style={{ background: '#09090b', padding: '24px', borderRadius: '14px', border: '1px solid #27272a' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', borderBottom: '1px solid #18181b', paddingBottom: '16px' }}>
                  <div>
                    <p style={{ color: '#a1a1aa', fontSize: '0.88rem', margin: '0 0 4px' }}>
                      Order: <strong style={{ color: '#fff' }}>#{order._id?.substring(0, 12)}...</strong>
                    </p>
                    <p style={{ color: '#71717a', fontSize: '0.82rem', margin: '0 0 6px' }}>
                      Placed On: {new Date(order.createdAt).toLocaleDateString()} • Invoice: {order.invoiceNumber || 'INV-AUTO'}
                    </p>
                    <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: 0 }}>
                      Total Amount: <strong style={{ color: '#f97316' }}>{formatPrice(order.totalAmount)}</strong>
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={{
                      background: currentStatus === 'Delivered' ? 'rgba(16,185,129,0.15)' : 'rgba(249,115,22,0.15)',
                      color: currentStatus === 'Delivered' ? '#10b981' : '#f97316',
                      padding: '5px 14px',
                      borderRadius: '20px',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}>
                      ● {currentStatus}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link
                        to={`/track/${order._id}`}
                        style={{
                          background: '#27272a',
                          color: '#fff',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          textDecoration: 'none',
                          fontWeight: 600
                        }}
                      >
                        🚚 Track Package
                      </Link>
                      <button
                        onClick={() => setSelectedInvoiceOrder(order)}
                        style={{
                          background: '#18181b',
                          border: '1px solid #3f3f46',
                          color: '#a1a1aa',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        📄 Invoice
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Stepper */}
                <div style={{ display: 'flex', overflowX: 'auto', padding: '24px 0 8px' }}>
                  {ORDER_STATUS_STEPS.map((step, index) => {
                    const complete = index <= currentIndex;
                    const event = history.find(e => e.status === step);
                    const date = event?.changedAt ? new Date(event.changedAt).toLocaleDateString() : '';

                    return (
                      <div key={step} style={{ display: 'flex', flex: '1 0 110px', alignItems: 'flex-start' }}>
                        <div style={{ width: '96px', textAlign: 'center' }}>
                          <span style={{
                            display: 'grid',
                            width: '26px',
                            height: '26px',
                            margin: '0 auto 6px',
                            placeItems: 'center',
                            borderRadius: '50%',
                            background: complete ? '#f97316' : '#27272a',
                            color: complete ? '#ffffff' : '#71717a',
                            fontSize: '11px',
                            fontWeight: 700
                          }}>
                            {complete ? '✓' : index + 1}
                          </span>
                          <span style={{ display: 'block', color: complete ? '#fff' : '#71717a', fontSize: '11px', lineHeight: 1.3 }}>
                            {step}
                          </span>
                          {date && <span style={{ display: 'block', marginTop: '3px', color: '#71717a', fontSize: '9px' }}>{date}</span>}
                        </div>
                        {index < ORDER_STATUS_STEPS.length - 1 && (
                          <span style={{
                            height: '2px',
                            flex: 1,
                            marginTop: '12px',
                            background: index < currentIndex ? '#f97316' : '#27272a'
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedInvoiceOrder && (
        <InvoiceModal order={selectedInvoiceOrder} onClose={() => setSelectedInvoiceOrder(null)} />
      )}
    </div>
  );
};

export default Profile;
