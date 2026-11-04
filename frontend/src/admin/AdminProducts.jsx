import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import ExternalSupplierSync from './ExternalSupplierSync';

const AdminProducts = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('all');
  const [showSupplierSync, setShowSupplierSync] = useState(false);
  const [updatingStockId, setUpdatingStockId] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this product from the central catalog?')) {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p._id !== id));
      }
    }
  };

  const handleQuickStock = async (id, delta) => {
    setUpdatingStockId(id);
    try {
      const res = await fetch(`/api/products/${id}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ delta })
      });
      const data = await res.json();
      if (res.ok && data.product) {
        setProducts(prev => prev.map(p => p._id === id ? { ...p, stock: data.product.stock } : p));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStockId('');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
                        (p.category && p.category.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = categoryFilter === 'All' || p.category?.toLowerCase() === categoryFilter.toLowerCase();
    const matchStock = stockFilter === 'all' ||
      (stockFilter === 'outOfStock' && p.stock === 0) ||
      (stockFilter === 'lowStock' && p.stock > 0 && p.stock <= (p.lowStockThreshold || 5)) ||
      (stockFilter === 'inStock' && p.stock > (p.lowStockThreshold || 5));
    return matchSearch && matchCategory && matchStock;
  });

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div>
          <span style={{ color: '#f97316', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Inventory Management
          </span>
          <h2 style={{ color: '#fff', fontSize: '2rem', margin: '4px 0 0', fontWeight: 800 }}>
            Centralised Products Catalog
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowSupplierSync(true)}
            style={{
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            🌐 3rd-Party Supplier Sync
          </button>
          <Link to="/admin/add-product" className="btn" style={{ padding: '10px 18px', fontSize: '0.9rem' }}>
            + Add New Product
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        background: '#09090b',
        padding: '16px',
        borderRadius: '10px',
        border: '1px solid #27272a',
        marginBottom: '20px'
      }}>
        <input
          type="text"
          placeholder="Search by product name, SKU, or brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: '1 1 240px',
            background: '#18181b',
            border: '1px solid #27272a',
            padding: '10px 14px',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '0.9rem',
            outline: 'none'
          }}
        />

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={selectStyle}
        >
          {categories.map(c => (
            <option key={c} value={c}>Category: {c}</option>
          ))}
        </select>

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="all">All Inventory States</option>
          <option value="inStock">In Stock (Healthy)</option>
          <option value="lowStock">Low Stock (≤ Threshold)</option>
          <option value="outOfStock">Out of Stock (0 units)</option>
        </select>

        <span style={{ color: '#71717a', fontSize: '0.85rem', marginLeft: 'auto' }}>
          {filteredProducts.length} of {products.length} products
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr style={rowStyle}>
              <th style={thStyle}>SKU / ID</th>
              <th style={thStyle}>PRODUCT</th>
              <th style={thStyle}>CATEGORY</th>
              <th style={thStyle}>PRICE</th>
              <th style={thStyle}>INVENTORY HEALTH</th>
              <th style={thStyle}>QUICK STOCK</th>
              <th style={thStyle}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={tdStyle}>Loading products catalog…</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan="7" style={tdStyle}>No products match your criteria.</td></tr>
            ) : filteredProducts.map(product => {
              const isOut = product.stock === 0;
              const isLow = !isOut && product.stock <= (product.lowStockThreshold || 5);

              return (
                <tr key={product._id} style={rowStyle}>
                  <td style={tdStyle}>
                    <span style={{ color: '#f97316', fontWeight: 700, fontSize: '0.85rem' }}>
                      {product.sku || product._id.substring(0, 8)}
                    </span>
                    {product.source === 'ThirdPartySync' && (
                      <span style={{ display: 'block', color: '#3b82f6', fontSize: '0.7rem' }}>● External Feed</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={product.imageUrl}
                        alt=""
                        style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';
                        }}
                      />
                      <div>
                        <strong style={{ color: '#fff', fontSize: '0.9rem', display: 'block' }}>{product.name}</strong>
                        <span style={{ color: '#71717a', fontSize: '0.78rem' }}>{product.brand || 'Basketry Studio'}</span>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ background: '#27272a', padding: '3px 8px', borderRadius: '4px', fontSize: '0.78rem', color: '#d4d4d8' }}>
                      {product.category}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <strong style={{ color: '#10b981' }}>₹{product.price.toFixed(2)}</strong>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      background: isOut ? 'rgba(239,68,68,0.2)' : isLow ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                      color: isOut ? '#ef4444' : isLow ? '#f59e0b' : '#10b981',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'inline-block'
                    }}>
                      {isOut ? 'Out of Stock (0)' : isLow ? `Low Stock (${product.stock})` : `In Stock (${product.stock})`}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => handleQuickStock(product._id, -1)}
                        disabled={updatingStockId === product._id || product.stock <= 0}
                        style={quickBtn}
                        title="Reduce stock by 1"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => handleQuickStock(product._id, 5)}
                        disabled={updatingStockId === product._id}
                        style={{ ...quickBtn, background: '#f97316' }}
                        title="Add 5 units to stock"
                      >
                        +5
                      </button>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <Link to={`/admin/edit-product/${product._id}`} style={editBtn}>Edit</Link>
                    <button onClick={() => handleDelete(product._id)} style={deleteBtn}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showSupplierSync && (
        <ExternalSupplierSync
          onClose={() => setShowSupplierSync(false)}
          onProductImported={() => fetchProducts()}
        />
      )}
    </div>
  );
};

const containerStyle = { maxWidth: '1200px', margin: '40px auto', padding: '30px', background: '#18181b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', color: '#fafafa' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const rowStyle = { borderBottom: '1px solid rgba(255,255,255,0.08)' };
const thStyle = { padding: '14px 12px', textAlign: 'left', color: '#a1a1aa', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em' };
const tdStyle = { padding: '14px 12px', textAlign: 'left', fontSize: '0.88rem' };
const selectStyle = { background: '#18181b', color: '#fafafa', border: '1px solid #27272a', padding: '10px 12px', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' };
const quickBtn = { background: '#27272a', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 };
const editBtn = { background: '#3b82f6', color: '#fff', padding: '6px 12px', borderRadius: '6px', marginRight: '8px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 };
const deleteBtn = { background: '#ef4444', color: '#fff', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 };

export default AdminProducts;
