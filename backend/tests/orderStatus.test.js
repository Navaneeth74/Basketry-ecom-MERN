const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ORDER_STATUSES,
  getNextOrderStatus,
  isValidOrderStatusTransition
} = require('../utils/orderStatus');

test('order fulfillment uses the complete status sequence', () => {
  assert.deepEqual(ORDER_STATUSES, [
    'Placed',
    'Confirmed',
    'Processing',
    'Shipped',
    'Out for Delivery',
    'Delivered'
  ]);
  for (let index = 0; index < ORDER_STATUSES.length - 1; index += 1) {
    assert.equal(
      isValidOrderStatusTransition(ORDER_STATUSES[index], ORDER_STATUSES[index + 1]),
      true
    );
  }
});

test('legacy Pending orders can enter the new fulfillment sequence', () => {
  assert.equal(getNextOrderStatus('Pending'), 'Confirmed');
  assert.equal(isValidOrderStatusTransition('Pending', 'Confirmed'), true);
});

test('order statuses cannot skip, reverse, or advance after delivery', () => {
  assert.equal(isValidOrderStatusTransition('Placed', 'Shipped'), false);
  assert.equal(isValidOrderStatusTransition('Shipped', 'Processing'), false);
  assert.equal(getNextOrderStatus('Delivered'), null);
});
