import React, { useEffect, useState, useContext } from 'react';
import ProductCard from '../components/ProductCard';
import { CurrencyContext } from '../context/CurrencyContext';
import '../styles/product.css';

const CATEGORIES = ['All', 'Electronics', 'Furniture', 'Clothing', 'Home Decor', 'Kitchenware'];

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [stockOnly, setStockOnly] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
                          (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
      const matchCat = selectedCategory === 'All' || p.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchStock = !stockOnly || p.stock > 0;
      return matchSearch && matchCat && matchStock;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'rating') return (b.ratings || 0) - (a.ratings || 0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <div className="shop-container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Header Banner */}
      <div className="shop-heading" style={{ marginBottom: '24px' }}>
        <div>
          <span className="section-eyebrow" style={{ color: '#f97316', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            The Basketry Catalog
          </span>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: '6px 0', letterSpacing: '-0.03em', color: '#fff' }}>
            Find your new favourite.
          </h1>
          <p style={{ color: '#a1a1aa', margin: 0, fontSize: '1rem' }}>
            Centralised inventory across all categories with real-time stock availability and order tracking.
          </p>
        </div>

        <input
          type="search"
          placeholder="Search by name, SKU, or keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-bar"
          aria-label="Search products"
          style={{
            background: '#18181b',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '12px 18px',
            borderRadius: '10px',
            fontSize: '0.95rem',
            width: '100%',
            maxWidth: '340px'
          }}
        />
      </div>

      {/* Filter and Category Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 20px',
        background: '#18181b',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
        marginBottom: '28px'
      }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat ? '#f97316' : '#27272a',
                color: selectedCategory === cat ? '#ffffff' : '#a1a1aa',
                border: 'none',
                padding: '7px 14px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort & Stock Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#a1a1aa', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={stockOnly}
              onChange={(e) => setStockOnly(e.target.checked)}
              style={{ accentColor: '#f97316' }}
            />
            In Stock Only
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', color: '#71717a' }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                background: '#09090b',
                color: '#fafafa',
                border: '1px solid #27272a',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid or Empty State */}
      {loading ? (
        <div className="empty-state" role="status" style={{ textAlign: 'center', padding: '60px 0', color: '#f97316' }}>
          Finding and formatting products…
        </div>
      ) : filteredProducts.length > 0 ? (
        <>
          <p style={{ color: '#71717a', fontSize: '0.85rem', marginBottom: '16px' }}>
            Showing {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'}
          </p>
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state" style={{ textAlign: 'center', padding: '60px 20px', background: '#18181b', borderRadius: '12px' }}>
          <h3 style={{ color: '#fff', marginBottom: '8px' }}>No matching products</h3>
          <p style={{ color: '#a1a1aa', margin: 0 }}>
            No products match “{search}” in category {selectedCategory}. Try resetting your search filters.
          </p>
          <button
            onClick={() => { setSearch(''); setSelectedCategory('All'); setStockOnly(false); }}
            className="btn"
            style={{ marginTop: '16px' }}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Shop;
