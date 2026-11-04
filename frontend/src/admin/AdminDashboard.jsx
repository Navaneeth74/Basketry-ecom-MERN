import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import ExternalSupplierSync from './ExternalSupplierSync';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSupplierSync, setShowSupplierSync] = useState(false);
  const [restockingId, setRestockingId] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportError, setExportError] = useState('');

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/analytics', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      } else {
        if (res.status === 401) navigate('/login');
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchStats();
  }, [user, navigate]);

  const handleQuickRestock = async (productId, currentStock) => {
    setRestockingId(productId);
    try {
      const res = await fetch(`/api/products/${productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ delta: 10 })
      });
      if (res.ok) {
        setFeedbackMessage('✓ Replenished stock by +10 units!');
        setTimeout(() => setFeedbackMessage(''), 3000);
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRestockingId('');
    }
  };

  const handleExportCSV = async () => {
    setExportingCSV(true);
    setExportError('');

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
      if (!userInfo?.token) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      const response = await fetch('/api/analytics/export-csv', {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });

      if (!response.ok) {
        let message = `Export failed (${response.status})`;
        try {
          const errorData = await response.json();
          message = errorData.message || message;
        } catch {
          // Keep the status-based message when the server response is not JSON.
        }
        throw new Error(message);
      }

      const csvBlob = await response.blob();
      const downloadUrl = URL.createObjectURL(csvBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = 'Basketry_MNC_Sales_Report.csv';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (error) {
      setExportError(error.message || 'Unable to export the sales report.');
    } finally {
      setExportingCSV(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', margin: '80px 0', color: '#f97316', fontSize: '1.2rem' }}>
        Synthesizing real-time MNC analytics and inventory metrics…
      </div>
    );
  }

  const s = stats || {
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    paidOrdersCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    statusCounts: {},
    salesTrend: [],
    categoryPerformance: [],
    topProducts: [],
    inventoryAlerts: [],
    recentOrders: []
  };

  // Find max revenue in salesTrend for chart scaling
  const maxTrendRevenue = Math.max(...(s.salesTrend?.map(t => t.revenue) || [1000]), 1000);

  return (
    <div style={{ padding: '24px 20px 80px', maxWidth: '1200px', margin: '0 auto', color: '#fafafa' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img
            src="/Basketrylogo.png"
            alt="Basketry"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://cdn-icons-png.flaticon.com/512/3514/3514491.png';
            }}
            style={{ height: '48px', width: '48px', borderRadius: '10px', objectFit: 'contain' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Basketry Admin Portal</h1>
              <span style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>
                MNC OPERATIONS
              </span>
            </div>
            <p style={{ margin: '4px 0 0', color: '#a1a1aa', fontSize: '0.9rem' }}>
              Lead Architect & Developer: <strong style={{ color: '#fff' }}>Navaneeth S</strong> • Real-time Order & Inventory Intelligence
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportCSV}
            disabled={exportingCSV}
            aria-busy={exportingCSV}
            style={{
              background: exportingCSV ? '#059669' : '#10b981',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: exportingCSV ? 'wait' : 'pointer',
              opacity: exportingCSV ? 0.8 : 1,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {exportingCSV ? 'Preparing CSV…' : '📥 Export Sales CSV'}
          </button>
          <button
            onClick={() => setShowSupplierSync(true)}
            style={{
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            🌐 3rd-Party Supplier Sync
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div style={{ padding: '12px 18px', background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', borderRadius: '8px', color: '#10b981', marginBottom: '20px' }}>
          {feedbackMessage}
        </div>
      )}
      {exportError && (
        <div role="alert" style={{ padding: '12px 18px', background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#f87171', marginBottom: '20px' }}>
          {exportError}
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={kpiCardStyle}>
          <span style={kpiLabelStyle}>Total Paid Revenue</span>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f97316' }}>
            ₹{s.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#10b981' }}>● {s.paidOrdersCount} Paid Transactions</span>
        </div>

        <div style={kpiCardStyle}>
          <span style={kpiLabelStyle}>Total Orders</span>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>
            {s.totalOrders}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Avg Order Value: ₹{s.averageOrderValue.toFixed(2)}</span>
        </div>

        <div style={kpiCardStyle}>
          <span style={kpiLabelStyle}>Catalog Products</span>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>
            {s.totalProducts}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Centralised across channels</span>
        </div>

        <div style={{
          ...kpiCardStyle,
          border: s.lowStockCount > 0 ? '1px solid rgba(245,158,11,0.5)' : kpiCardStyle.border
        }}>
          <span style={kpiLabelStyle}>Low / Out of Stock</span>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: s.lowStockCount > 0 ? '#f59e0b' : '#10b981' }}>
            {s.lowStockCount}
          </div>
          <span style={{ fontSize: '0.8rem', color: s.outOfStockCount > 0 ? '#ef4444' : '#a1a1aa' }}>
            {s.outOfStockCount} Out of Stock
          </span>
        </div>

        <div style={kpiCardStyle}>
          <span style={kpiLabelStyle}>Registered Customers</span>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>
            {s.totalUsers}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Active consumer profiles</span>
        </div>
      </div>

      {/* Emergency Low-Stock Replenishment Alert */}
      {s.inventoryAlerts && s.inventoryAlerts.length > 0 && (
        <div style={{ background: '#1c1917', border: '1px solid #78350f', borderRadius: '14px', padding: '20px 24px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <h3 style={{ margin: 0, color: '#fbbf24', fontSize: '1.1rem' }}>
                Inventory Replenishment Warnings ({s.inventoryAlerts.length} items need stock)
              </h3>
            </div>
            <Link to="/admin/products" style={{ color: '#f97316', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
              Open Product Manager →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {s.inventoryAlerts.map(item => (
              <div key={item._id} style={{ background: '#0c0a09', padding: '12px 16px', borderRadius: '8px', border: '1px solid #292524', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 2px', color: '#fff', fontSize: '0.9rem' }}>{item.name}</h4>
                  <span style={{ fontSize: '0.78rem', color: '#a8a29e' }}>
                    SKU: {item.sku} • Stock: <strong style={{ color: item.stock === 0 ? '#ef4444' : '#f59e0b' }}>{item.stock}</strong> (Threshold: {item.lowStockThreshold})
                  </span>
                </div>
                <button
                  onClick={() => handleQuickRestock(item._id, item.stock)}
                  disabled={restockingId === item._id}
                  style={{
                    background: '#27272a',
                    color: '#f97316',
                    border: '1px solid #3f3f46',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {restockingId === item._id ? '…' : '+10 Stock'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Automated Data Visualizations Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Visual Sales & Revenue Trend Chart */}
        <div style={chartBoxStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>📈 Sales & Revenue Activity</h3>
            <span style={{ fontSize: '0.78rem', color: '#a1a1aa' }}>Automated SVG Visualization</span>
          </div>

          {s.salesTrend && s.salesTrend.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '180px', padding: '10px 0', borderBottom: '1px solid #27272a' }}>
              {s.salesTrend.map((point, idx) => {
                const heightPercent = maxTrendRevenue > 0 ? Math.max(10, Math.round((point.revenue / maxTrendRevenue) * 100)) : 10;
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.72rem', color: '#f97316', fontWeight: 700, marginBottom: '4px' }}>
                      {point.revenue > 0 ? `₹${Math.round(point.revenue / 1000)}k` : '₹0'}
                    </span>
                    <div
                      title={`${point.date}: ₹${point.revenue} (${point.orders} orders)`}
                      style={{
                        width: '100%',
                        maxWidth: '36px',
                        height: `${heightPercent}%`,
                        background: 'linear-gradient(180deg, #f97316 0%, #c2410c 100%)',
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 0.4s ease'
                      }}
                    />
                    <span style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '6px' }}>
                      {point.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: '#71717a', textAlign: 'center', margin: '40px 0' }}>No recent transaction telemetry</p>
          )}
        </div>

        {/* Order Fulfillment Pipeline */}
        <div style={chartBoxStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>🚚 Fulfillment Pipeline</h3>
            <Link to="/admin/orders" style={{ fontSize: '0.8rem', color: '#f97316', textDecoration: 'none' }}>Manage →</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {['Placed', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'].map(statusName => {
              const count = s.statusCounts[statusName] || 0;
              const percent = s.totalOrders > 0 ? Math.round((count / s.totalOrders) * 100) : 0;

              return (
                <div key={statusName}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                    <span style={{ color: '#d4d4d8' }}>{statusName}</span>
                    <span style={{ color: '#f97316', fontWeight: 700 }}>{count} ({percent}%)</span>
                  </div>
                  <div style={{ background: '#09090b', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${percent}%`,
                      height: '100%',
                      background: statusName === 'Delivered' ? '#10b981' : '#f97316',
                      borderRadius: '3px'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Performance & Top Selling Products */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Category Share */}
        <div style={chartBoxStyle}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#fff' }}>🏷️ Category Revenue Performance</h3>
          {s.categoryPerformance && s.categoryPerformance.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {s.categoryPerformance.map(cat => (
                <div key={cat.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#09090b', borderRadius: '8px' }}>
                  <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>{cat.category}</span>
                  <span style={{ color: '#f97316', fontWeight: 700, fontSize: '0.95rem' }}>₹{cat.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#71717a' }}>No category transactions recorded yet.</p>
          )}
        </div>

        {/* Top Products */}
        <div style={chartBoxStyle}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#fff' }}>⭐ Top Performing Products</h3>
          {s.topProducts && s.topProducts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {s.topProducts.map((p, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#09090b', borderRadius: '8px' }}>
                  <div>
                    <span style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 600, display: 'block' }}>{p.name}</span>
                    <span style={{ color: '#71717a', fontSize: '0.78rem' }}>{p.units} units sold</span>
                  </div>
                  <strong style={{ color: '#10b981', fontSize: '0.9rem' }}>₹{p.revenue.toFixed(2)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#71717a' }}>No top sellers recorded yet.</p>
          )}
        </div>
      </div>

      {/* Navigation Shortcuts */}
      <div style={{ padding: '28px', background: '#18181b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 style={{ margin: '0 0 20px', color: '#f97316', fontSize: '1.2rem' }}>Administrative Modules</h3>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => navigate('/admin/add-product')}>
            + Add New Product
          </button>
          <button className="btn" onClick={() => navigate('/admin/products')} style={{ background: '#27272a' }}>
            📦 Products & Stock Table
          </button>
          <button className="btn" onClick={() => navigate('/admin/orders')} style={{ background: '#27272a' }}>
            🚚 Orders & Fulfillment
          </button>
          <button className="btn" onClick={() => navigate('/admin/users')} style={{ background: '#27272a' }}>
            👥 User Accounts
          </button>
          <button className="btn" onClick={() => setShowSupplierSync(true)} style={{ background: '#3b82f6' }}>
            🌐 Third-Party Supplier Catalog Sync
          </button>
        </div>
      </div>

      {showSupplierSync && (
        <ExternalSupplierSync
          onClose={() => setShowSupplierSync(false)}
          onProductImported={() => fetchStats()}
        />
      )}
    </div>
  );
};

const kpiCardStyle = {
  padding: '20px',
  background: '#18181b',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: '14px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
};

const kpiLabelStyle = {
  color: '#a1a1aa',
  fontSize: '0.85rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
};

const chartBoxStyle = {
  background: '#18181b',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: '16px',
  padding: '24px'
};

export default AdminDashboard;
