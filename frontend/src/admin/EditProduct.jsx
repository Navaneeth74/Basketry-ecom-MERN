import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';

const EditProduct = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    sku: '',
    brand: '',
    lowStockThreshold: '',
    imageUrl: ''
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        setFormData({
          name: data.name || '',
          description: data.description || '',
          price: data.price || '',
          category: data.category || '',
          stock: data.stock || 0,
          sku: data.sku || '',
          brand: data.brand || '',
          lowStockThreshold: data.lowStockThreshold || 5,
          imageUrl: data.imageUrl || ''
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchProduct();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('category', formData.category);
    data.append('stock', formData.stock);
    if (formData.sku) data.append('sku', formData.sku);
    if (formData.brand) data.append('brand', formData.brand);
    if (formData.lowStockThreshold) data.append('lowStockThreshold', formData.lowStockThreshold);
    if (formData.imageUrl) data.append('imageUrl', formData.imageUrl);
    if (image) data.append('image', image);

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${user.token}` },
        body: data
      });
      const resData = await res.json();
      if (res.ok) {
        navigate('/admin/products');
      } else {
        setError(resData.message || 'Error updating product');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '40px auto', background: '#18181b', padding: '36px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ color: '#f97316', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Inventory Modification
      </span>
      <h2 style={{ color: '#fff', fontSize: '1.8rem', margin: '4px 0 20px', fontWeight: 800 }}>Edit Product #{id.substring(0, 8)}</h2>

      {error && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <input type="text" placeholder="Product Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={inputStyle} />
        <textarea placeholder="Description" required rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={inputStyle} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <input type="number" step="0.01" placeholder="Price (INR)" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} style={inputStyle} />
          <input type="number" placeholder="Stock" required value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} style={inputStyle} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <input type="text" placeholder="Category" required value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} style={inputStyle} />
          <input type="text" placeholder="Brand" value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} style={inputStyle} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <input type="text" placeholder="SKU" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} style={inputStyle} />
          <input type="number" placeholder="Low Stock Threshold" value={formData.lowStockThreshold} onChange={(e) => setFormData({...formData, lowStockThreshold: e.target.value})} style={inputStyle} />
        </div>

        <input type="url" placeholder="Direct Image URL" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} style={inputStyle} />

        <div style={{ padding: '16px', border: '1px dashed #3f3f46', borderRadius: '8px', background: '#09090b' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#a1a1aa', fontSize: '0.85rem' }}>Or Replace Image File (Cloudinary)</label>
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} style={{ color: '#fff', fontSize: '0.85rem' }} />
        </div>

        <button type="submit" disabled={loading} className="btn" style={{ marginTop: '8px', padding: '14px', fontSize: '1rem', fontWeight: 700 }}>
          {loading ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

const inputStyle = { padding: '12px', background: '#09090b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' };
export default EditProduct;
