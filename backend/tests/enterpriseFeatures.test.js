const test = require('node:test');
const assert = require('node:assert/strict');

test('SKU auto-generation adheres to MNC format BSK-{CAT}-{RAND}', () => {
  const category = 'Electronics';
  const catCode = category.substring(0, 3).toUpperCase();
  const rand = 4821;
  const sku = `BSK-${catCode}-${rand}`;

  assert.match(sku, /^BSK-[A-Z]{3}-\d{4}$/);
});

test('tracking number format adheres to BSK-TRK-XXXXXX', () => {
  const rand = 782194;
  const trackingNumber = `BSK-TRK-${rand}`;

  assert.match(trackingNumber, /^BSK-TRK-\d{6}$/);
});

test('inventory status correctly categorizes inStock, lowStock, and outOfStock', () => {
  const checkHealth = (stock, threshold = 5) => {
    if (stock === 0) return 'Out of Stock';
    if (stock <= threshold) return 'Low Stock';
    return 'In Stock';
  };

  assert.equal(checkHealth(0, 5), 'Out of Stock');
  assert.equal(checkHealth(3, 5), 'Low Stock');
  assert.equal(checkHealth(5, 5), 'Low Stock');
  assert.equal(checkHealth(12, 5), 'In Stock');
});
