import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import InvoiceModal from '../components/InvoiceModal';

const ORDER_STEPS = [
  'Placed',
  'Confirmed',
  'Processing',
  'Shipped',
  'Out for Delivery',
  'Delivered'
];

const STEP_DESCRIPTIONS = {
  Placed: 'Order received and logged into central inventory system.',
  Confirmed: 'Payment verified and transaction confirmed.',
  Processing: 'Items picked from warehouse shelves and packaged.',
  Shipped: 'Parcel dispatched and handed over to logistics carrier.',
  'Out for Delivery': 'Package loaded onto courier agent van for final delivery.',
  Delivered: 'Package safely delivered and signed at customer address.'
};

const TrackOrder = () => {
  const { orderId: paramId } = useParams();
  const [searchInput, setSearchInput] = useState(paramId || '');
  const [orderData, setOrderData] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);

  const fetchTracking = async (identifier) => {
    if (!identifier || !identifier.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(identifier.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Could not find tracking info for this identifier.');
      }
      setOrderData(data);

      // Fetch logistics telemetry from 3rd-party logistics endpoint
      const trackingNumber = data.trackingNumber || identifier;
      const teleRes = await fetch(`/api/external/track-courier/${encodeURIComponent(trackingNumber)}`);
      const teleData = await teleRes.json();
      if (teleRes.ok && teleData.checkpoints) {
        setTelemetry(teleData);
      }
    } catch (err) {
      setError(err.message);
      setOrderData(null);
      setTelemetry(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramId) {
      fetchTracking(paramId);
    }
  }, [paramId]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTracking(searchInput);
  };

  const currentStatus = orderData?.status === 'Pending' ? 'Placed' : (orderData?.status || 'Placed');
  const activeIndex = ORDER_STEPS.indexOf(currentStatus);

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px 60px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <span style={{ color: '#f97316', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Real-Time Shipment Journey
        </span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', margin: '6px 0 12px' }}>
          Track Your Package
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '1rem', maxWidth: '580px', margin: '0 auto' }}>
          Monitor the end-to-end journey from our warehouse shelf to your doorstep with live milestone updates.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ maxWidth: '560px', margin: '24px auto 0', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Enter Order ID or Tracking Number (e.g., BSK-TRK-...)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              flex: 1,
              background: '#18181b',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              padding: '14px 18px',
              color: '#fff',
              fontSize: '0.95rem',
              outline: 'none'
            }}
          />
          <button type="submit" className="btn" style={{ padding: '0 24px', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
            Track Package
          </button>
        </form>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#f97316' }}>
          Querying logistics tracking telemetry…
        </div>
      )}

      {error && (
        <div role="alert" style={{ maxWidth: '600px', margin: '0 auto 30px', padding: '16px', background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444', borderRadius: '10px', color: '#ef4444', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* Tracking Result View */}
      {orderData && (
        <div style={{ background: '#18181b', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)', padding: 'clamp(20px, 4vw, 36px)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
          {/* Top Shipment Info Strip */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '24px', marginBottom: '32px' }}>
            <div>
              <span style={{ color: '#71717a', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tracking Identifier
              </span>
              <h3 style={{ margin: '4px 0 6px', color: '#fff', fontSize: '1.4rem', fontWeight: 800 }}>
                {orderData.trackingNumber || 'BSK-TRK-PENDING'}
              </h3>
              <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.88rem' }}>
                Carrier: <strong style={{ color: '#f97316' }}>{orderData.carrier || 'Basketry Express Logistics'}</strong> • Order ID: #{orderData.orderId?.substring(0, 10)}...
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{
                background: currentStatus === 'Delivered' ? 'rgba(16,185,129,0.2)' : 'rgba(249,115,22,0.2)',
                color: currentStatus === 'Delivered' ? '#10b981' : '#f97316',
                padding: '6px 16px',
                borderRadius: '20px',
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'inline-block'
              }}>
                ● {currentStatus}
              </span>
              <p style={{ margin: '8px 0 0', color: '#a1a1aa', fontSize: '0.85rem' }}>
                Est. Delivery: <strong style={{ color: '#fff' }}>
                  {orderData.estimatedDelivery ? new Date(orderData.estimatedDelivery).toLocaleDateString() : '3-4 Business Days'}
                </strong>
              </p>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div style={{ marginBottom: '40px' }}>
            <h4 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.1rem' }}>Fulfillment Stages</h4>
            <div style={{ display: 'flex', overflowX: 'auto', padding: '10px 0' }}>
              {ORDER_STEPS.map((step, index) => {
                const complete = index <= activeIndex;
                const isCurrent = index === activeIndex;

                return (
                  <div key={step} style={{ display: 'flex', flex: '1 0 130px', alignItems: 'flex-start' }}>
                    <div style={{ width: '110px', textAlign: 'center' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        margin: '0 auto 10px',
                        borderRadius: '50%',
                        background: complete ? '#f97316' : '#27272a',
                        color: complete ? '#ffffff' : '#71717a',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        boxShadow: isCurrent ? '0 0 15px rgba(249,115,22,0.5)' : 'none',
                        border: isCurrent ? '2px solid #ffffff' : 'none'
                      }}>
                        {complete ? '✓' : index + 1}
                      </div>
                      <span style={{ display: 'block', color: complete ? '#fff' : '#71717a', fontSize: '0.85rem', fontWeight: complete ? 700 : 500 }}>
                        {step}
                      </span>
                    </div>
                    {index < ORDER_STEPS.length - 1 && (
                      <div style={{
                        flex: 1,
                        height: '3px',
                        background: index < activeIndex ? '#f97316' : '#27272a',
                        marginTop: '17px'
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Logistics Checkpoints & Telemetry */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            {/* Timeline */}
            <div style={{ background: '#09090b', padding: '24px', borderRadius: '12px', border: '1px solid #27272a' }}>
              <h4 style={{ color: '#f97316', margin: '0 0 16px', fontSize: '1rem' }}>
                📍 Checkpoint Activity Log
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(telemetry?.checkpoints || []).map((cp, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: cp.done ? '#10b981' : '#3f3f46',
                      marginTop: '5px',
                      flexShrink: 0
                    }} />
                    <div>
                      <p style={{ margin: 0, color: cp.done ? '#fff' : '#71717a', fontSize: '0.88rem', fontWeight: cp.done ? 600 : 400 }}>
                        {cp.event}
                      </p>
                      <p style={{ margin: '2px 0 0', color: '#a1a1aa', fontSize: '0.78rem' }}>
                        {cp.hub} • <span style={{ color: '#71717a' }}>{cp.time}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Destination & Action */}
            <div style={{ background: '#09090b', padding: '24px', borderRadius: '12px', border: '1px solid #27272a', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ color: '#fff', margin: '0 0 12px', fontSize: '1rem' }}>Delivery Destination</h4>
                <p style={{ color: '#a1a1aa', fontSize: '0.88rem', margin: '0 0 8px' }}>
                  City: <strong style={{ color: '#fff' }}>{orderData.destinationCity || 'Customer Address'}</strong>
                </p>
                <p style={{ color: '#a1a1aa', fontSize: '0.88rem', margin: '0 0 16px' }}>
                  Items in Parcel: <strong style={{ color: '#fff' }}>{orderData.itemCount} item(s)</strong>
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto', marginBottom: '16px' }}>
                  {(orderData.items || []).map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#18181b', padding: '8px', borderRadius: '6px' }}>
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt="" style={{ width: '30px', height: '30px', borderRadius: '4px', objectFit: 'cover' }} />
                      )}
                      <span style={{ color: '#fff', fontSize: '0.82rem', flex: 1 }}>{item.name}</span>
                      <span style={{ color: '#71717a', fontSize: '0.8rem' }}>×{item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowInvoice(true)}
                  style={{
                    flex: 1,
                    background: '#27272a',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}
                >
                  📄 View Tax Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInvoice && orderData && (
        <InvoiceModal order={{
          _id: orderData.orderId,
          invoiceNumber: orderData.invoiceNumber,
          totalAmount: orderData.totalAmount,
          createdAt: orderData.createdAt,
          items: orderData.items,
          carrier: orderData.carrier,
          trackingNumber: orderData.trackingNumber,
          address: {
            city: orderData.destinationCity,
            country: orderData.destinationCountry
          }
        }} onClose={() => setShowInvoice(false)} />
      )}
    </div>
  );
};

export default TrackOrder;
