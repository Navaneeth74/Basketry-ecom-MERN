import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const ExternalSupplierSync = ({ onClose, onProductImported }) => {
  const { user } = useContext(AuthContext);
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('');
  const [importingId, setImportingId] = useState('');
  const [importedIds, setImportedIds] = useState(new Set());
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const fetchSupplierFeed = async () => {
      try {
        const res = await fetch('/api/external/supplier-catalog', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          setSupplierProducts(data.products);
          setSource(data.source || '3rd-Party Supplier Feed');
        }
      } catch (err) {
        setStatusMessage(`Error connecting to external supplier API: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchSupplierFeed();
  }, [user]);

  const handleImport = async (product) => {
    setImportingId(product.externalId);
    setStatusMessage('');
    try {
      const res = await fetch('/api/external/import-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(product)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Could not import product.');
      }
      setImportedIds(prev => new Set(prev).add(product.externalId));
      setStatusMessage(`✓ Successfully imported "${product.name}" into Basketry catalog!`);
      if (onProductImported) onProductImported(data.product);
    } catch (err) {
      setStatusMessage(`Import failed: ${err.message}`);
    } finally {
      setImportingId('');
    }
  };

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <span style={{ color: '#f97316', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Third-Party API Integration
            </span>
            <h3 style={{ margin: '4px 0 0', color: '#fff', fontSize: '1.4rem' }}>
              External Supplier Catalog Sync
            </h3>
            <p style={{ margin: '4px 0 0', color: '#a1a1aa', fontSize: '0.85rem' }}>
              Source: <strong style={{ color: '#10b981' }}>{source}</strong> • Centralising external inventory feeds into Basketry
            </p>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>✕ Close</button>
        </div>

        {statusMessage && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '0.88rem',
            background: statusMessage.startsWith('✓') ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            color: statusMessage.startsWith('✓') ? '#10b981' : '#ef4444',
            border: `1px solid ${statusMessage.startsWith('✓') ? '#10b981' : '#ef4444'}`
          }}>
            {statusMessage}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#f97316' }}>
            Loading feed from 3rd-party supplier API…
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '6px' }}>
            {supplierProducts.map((p) => {
              const isImported = importedIds.has(p.externalId);
              const isImporting = importingId === p.externalId;

              return (
                <div key={p.externalId} style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ color: '#f97316', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      {p.category}
                    </span>
                    <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>
                      Stock: {p.stock}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 6px', color: '#fff', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </h4>
                  <p style={{ margin: '0 0 12px', color: '#71717a', fontSize: '0.8rem', lineHeight: 1.4, height: '34px', overflow: 'hidden' }}>
                    {p.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #18181b' }}>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>
                      ₹{p.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleImport(p)}
                      disabled={isImported || isImporting}
                      style={{
                        background: isImported ? '#10b981' : '#f97316',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: (isImported || isImporting) ? 'default' : 'pointer',
                        opacity: isImporting ? 0.6 : 1
                      }}
                    >
                      {isImported ? '✓ Imported' : isImporting ? 'Importing…' : '+ Import to Store'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
  background: 'rgba(0,0,0,0.8)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
  padding: '20px'
};

const modalStyle = {
  background: '#18181b',
  borderRadius: '16px',
  maxWidth: '900px',
  width: '100%',
  maxHeight: '85vh',
  padding: '24px',
  border: '1px solid rgba(255,255,255,0.1)',
  display: 'flex',
  flexDirection: 'column'
};

const closeBtnStyle = {
  background: '#27272a',
  color: '#fff',
  border: 'none',
  padding: '8px 14px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.85rem'
};

export default ExternalSupplierSync;
