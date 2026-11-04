const ORDER_STATUSES = [
  'Placed',
  'Confirmed',
  'Processing',
  'Shipped',
  'Out for Delivery',
  'Delivered'
];

const NEXT_ORDER_STATUS = {
  Pending: 'Confirmed',
  Placed: 'Confirmed',
  Confirmed: 'Processing',
  Processing: 'Shipped',
  Shipped: 'Out for Delivery',
  'Out for Delivery': 'Delivered'
};

const getNextOrderStatus = (status) => NEXT_ORDER_STATUS[status] || null;

const isValidOrderStatusTransition = (currentStatus, nextStatus) => (
  getNextOrderStatus(currentStatus) === nextStatus
);

module.exports = {
  ORDER_STATUSES,
  getNextOrderStatus,
  isValidOrderStatusTransition
};
