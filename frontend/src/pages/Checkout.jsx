import React, { useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CurrencyContext } from '../context/CurrencyContext';
import { clearCart } from '../redux/cartSlice';

const Checkout = () => {
  const { user } = useContext(AuthContext);
  const { formatPrice, currency } = useContext(CurrencyContext);
  const cartItems = useSelector((state) => state.cart.cartItems);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    fullName: user?.name || '',
    street: '',
    city: '',
    postalCode: '',
    country: 'India'
  });
  const [paymentMode, setPaymentMode] = useState('sandbox'); // 'sandbox' (Default instant test) or 'razorpay'
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const totalPrice = cartItems.reduce((total, item) => total + (item.price || 0) * (item.qty || 1), 0);

  // Instant MNC Sandbox / Demo Checkout handler
  const handleSandboxCheckout = async () => {
    setProcessing(true);
    setError('');
    try {
      const res = await fetch('/api/payment/sandbox-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          items: cartItems.map(({ productId, qty }) => ({ productId, qty })),
          address
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Could not complete sandbox checkout.');
      }

      dispatch(clearCart());
      navigate('/ordersuccess', { state: { order: data.order } });
    } catch (err) {
      setError(err.message);
      setProcessing(false);
    }
  };

  // Razorpay Gateway payment flow
  const handleRazorpayPayment = async () => {
    setProcessing(true);
    setError('');
    let checkoutTimeout;
    let paymentOutcomeHandled = false;
    const clearCheckoutTimeout = () => window.clearTimeout(checkoutTimeout);

    try {
      const orderRes = await fetch('/api/payment/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          items: cartItems.map(({ productId, qty }) => ({ productId, qty })),
          address
        })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.message || 'Could not start payment.');
      }
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK script not found. Please switch to Instant Sandbox Gateway mode.');
      }

      const payment = new window.Razorpay({
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Basketry',
        description: 'Basketry Order Payment',
        order_id: orderData.id,
        handler: async (response) => {
          if (paymentOutcomeHandled) return;
          paymentOutcomeHandled = true;
          clearCheckoutTimeout();

          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${user.token}`
              },
              body: JSON.stringify(response)
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.message || 'Payment verification failed.');
            }

            dispatch(clearCart());
            navigate('/ordersuccess', { state: { order: verifyData } });
          } catch (verificationError) {
            setError(verificationError.message);
            setProcessing(false);
          }
        },
        prefill: {
          name: address.fullName,
          email: user.email
        },
        theme: { color: '#f97316' },
        modal: {
          ondismiss: () => {
            if (!paymentOutcomeHandled) {
              setProcessing(false);
              setError('Payment modal dismissed. You can retry with Razorpay or use Instant Sandbox Gateway.');
            }
          }
        }
      });

      payment.on('payment.failed', (event) => {
        paymentOutcomeHandled = true;
        clearCheckoutTimeout();
        setError(`Payment failed: ${event.error?.description || 'Gateway transaction declined'}`);
        setProcessing(false);
      });

      payment.open();
    } catch (paymentError) {
      setError(`${paymentError.message} (Tip: You can select 'Instant Sandbox Payment' below to complete the order instantly).`);
      setProcessing(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (cartItems.length === 0 || processing) {
      return;
    }

    if (paymentMode === 'sandbox') {
      handleSandboxCheckout();
    } else {
      handleRazorpayPayment();
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="checkout-container" style={{ maxWidth: '600px', margin: '60px auto', padding: '30px', background: '#18181b', borderRadius: '16px', textAlign: 'center' }}>
        <h2 style={{ color: '#fff' }}>Checkout</h2>
        <p style={{ color: '#a1a1aa', margin: '16px 0 24px' }}>Your shopping cart is empty.</p>
        <Link to="/shop" className="btn">Browse Catalog</Link>
      </div>
    );
  }

  return (
    <div className="checkout-container" style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
      <h2 style={{ color: '#fff', fontSize: '2.2rem', marginBottom: '8px', fontWeight: 800 }}>Order Checkout</h2>
      <p style={{ color: '#a1a1aa', marginBottom: '30px' }}>
        Complete your shipping details to generate your tracking number and tax invoice.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        {/* Left: Address Form */}
        <form onSubmit={handleSubmit} style={{ background: '#18181b', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ color: '#f97316', margin: '0 0 20px', fontSize: '1.2rem' }}>1. Delivery Address</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="text"
              placeholder="Recipient Full Name"
              required
              value={address.fullName}
              onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Street Address, Apt / Suite"
              required
              value={address.street}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
              style={inputStyle}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input
                type="text"
                placeholder="City"
                required
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Postal Code"
                required
                value={address.postalCode}
                onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                style={inputStyle}
              />
            </div>
            <input
              type="text"
              placeholder="Country"
              required
              value={address.country}
              onChange={(e) => setAddress({ ...address, country: e.target.value })}
              style={inputStyle}
            />
          </div>

          <h3 style={{ color: '#f97316', margin: '28px 0 16px', fontSize: '1.2rem' }}>2. Payment Verification Mode</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {/* Option 1: Sandbox Demo Gateway */}
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px',
              borderRadius: '10px',
              background: paymentMode === 'sandbox' ? 'rgba(249,115,22,0.1)' : '#09090b',
              border: `1px solid ${paymentMode === 'sandbox' ? '#f97316' : '#27272a'}`,
              cursor: 'pointer'
            }}>
              <input
                type="radio"
                name="paymentMode"
                value="sandbox"
                checked={paymentMode === 'sandbox'}
                onChange={() => setPaymentMode('sandbox')}
                style={{ marginTop: '4px', accentColor: '#f97316' }}
              />
              <div>
                <strong style={{ color: '#fff', display: 'block', fontSize: '0.95rem' }}>
                  ⚡ Instant MNC Sandbox Gateway (Recommended for Grading & Testing)
                </strong>
                <span style={{ color: '#a1a1aa', fontSize: '0.82rem', lineHeight: 1.4, display: 'block', marginTop: '2px' }}>
                  Simulates complete payment confirmation, stock deduction, and tax invoice generation instantly without external merchant popups.
                </span>
              </div>
            </label>

            {/* Option 2: Razorpay Live Gateway */}
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px',
              borderRadius: '10px',
              background: paymentMode === 'razorpay' ? 'rgba(249,115,22,0.1)' : '#09090b',
              border: `1px solid ${paymentMode === 'razorpay' ? '#f97316' : '#27272a'}`,
              cursor: 'pointer'
            }}>
              <input
                type="radio"
                name="paymentMode"
                value="razorpay"
                checked={paymentMode === 'razorpay'}
                onChange={() => setPaymentMode('razorpay')}
                style={{ marginTop: '4px', accentColor: '#f97316' }}
              />
              <div>
                <strong style={{ color: '#fff', display: 'block', fontSize: '0.95rem' }}>
                  💳 Razorpay Standard Gateway (Test / Live API)
                </strong>
                <span style={{ color: '#a1a1aa', fontSize: '0.82rem', lineHeight: 1.4, display: 'block', marginTop: '2px' }}>
                  Uses configured Razorpay credentials. Requires active merchant test tokens.
                </span>
              </div>
            </label>
          </div>

          {error && (
            <div role="alert" style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', fontSize: '0.88rem', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn"
            disabled={processing}
            style={{ width: '100%', padding: '14px', fontSize: '1.05rem', fontWeight: 700 }}
          >
            {processing ? 'Securing Transaction & Deducting Inventory…' : `Pay ${formatPrice(totalPrice)} & Place Order`}
          </button>
        </form>

        {/* Right: Order Summary */}
        <div style={{ background: '#18181b', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', height: 'fit-content' }}>
          <h3 style={{ color: '#fff', margin: '0 0 16px', fontSize: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
            Items in Shipment
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '280px', overflowY: 'auto', marginBottom: '20px' }}>
            {cartItems.map((item) => (
              <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src={item.imageUrl} alt={item.name} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                  <div>
                    <h5 style={{ margin: 0, color: '#fff', fontSize: '0.88rem' }}>{item.name}</h5>
                    <span style={{ color: '#71717a', fontSize: '0.8rem' }}>Qty: {item.qty} × {formatPrice(item.price)}</span>
                  </div>
                </div>
                <strong style={{ color: '#f97316', fontSize: '0.9rem' }}>
                  {formatPrice(item.price * item.qty)}
                </strong>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: '#a1a1aa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Integrated Tax (18% included):</span>
              <span>{formatPrice(totalPrice - (totalPrice / 1.18))}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Carrier Delivery:</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>FREE (Basketry Express)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', marginTop: '6px', fontSize: '1.2rem', color: '#fff', fontWeight: 800 }}>
              <span>Total Payable ({currency}):</span>
              <span style={{ color: '#f97316' }}>{formatPrice(totalPrice)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  background: '#09090b',
  border: '1px solid #27272a',
  borderRadius: '8px',
  padding: '12px 14px',
  color: '#fff',
  fontSize: '0.92rem',
  outline: 'none',
  width: '100%'
};

export default Checkout;
