const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

const getAdminStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments({});
    const totalProducts = await Product.countDocuments({});
    const totalUsers = await User.countDocuments({ role: 'user' });

    const allOrders = await Order.find({})
      .populate('userId', 'name email')
      .populate('items.productId', 'name category price stock lowStockThreshold')
      .sort({ createdAt: -1 });

    const paidOrders = allOrders.filter(o => o.paymentStatus === 'Paid');
    const totalRevenue = paidOrders.reduce((acc, item) => acc + (item.totalAmount || 0), 0);
    const averageOrderValue = paidOrders.length > 0 ? (totalRevenue / paidOrders.length) : 0;

    // Order status breakdown
    const statusCounts = {
      Placed: 0,
      Confirmed: 0,
      Processing: 0,
      Shipped: 0,
      'Out for Delivery': 0,
      Delivered: 0,
      Pending: 0
    };

    allOrders.forEach(o => {
      const st = o.status || 'Placed';
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    });

    // Product Inventory Alerts
    const allProductsList = await Product.find({}).sort({ stock: 1 });
    const inventoryAlerts = allProductsList
      .filter(p => p.stock <= (p.lowStockThreshold || 5))
      .map(p => ({
        _id: p._id,
        name: p.name,
        category: p.category,
        sku: p.sku || 'BSK-SKU',
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold || 5,
        status: p.stock === 0 ? 'Out of Stock' : 'Low Stock',
        price: p.price
      }));

    const lowStockCount = inventoryAlerts.length;
    const outOfStockCount = inventoryAlerts.filter(p => p.stock === 0).length;

    // Sales Trend (Past 7 periods / days or grouped by date)
    const salesByDate = {};
    const today = new Date();
    // Default last 7 days buckets
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      salesByDate[dateStr] = { date: dateStr, revenue: 0, orders: 0 };
    }

    paidOrders.forEach(o => {
      const dStr = new Date(o.createdAt).toISOString().split('T')[0];
      if (salesByDate[dStr]) {
        salesByDate[dStr].revenue += o.totalAmount || 0;
        salesByDate[dStr].orders += 1;
      }
    });

    const salesTrend = Object.values(salesByDate);

    // Category Sales Breakdown & Top Selling Products
    const categoryTotals = {};
    const productSalesMap = {};

    paidOrders.forEach(o => {
      (o.items || []).forEach(item => {
        const cat = (item.productId && item.productId.category) || 'General';
        const lineTotal = (item.price || 0) * (item.qty || 1);
        categoryTotals[cat] = (categoryTotals[cat] || 0) + lineTotal;

        const prodName = (item.productId && item.productId.name) || item.name || 'Basketry Item';
        if (!productSalesMap[prodName]) {
          productSalesMap[prodName] = { name: prodName, units: 0, revenue: 0, category: cat };
        }
        productSalesMap[prodName].units += (item.qty || 1);
        productSalesMap[prodName].revenue += lineTotal;
      });
    });

    const categoryPerformance = Object.entries(categoryTotals).map(([category, revenue]) => ({
      category,
      revenue: Math.round(revenue * 100) / 100
    }));

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Recent 6 Orders
    const recentOrders = allOrders.slice(0, 6).map(o => ({
      _id: o._id,
      userName: o.userId?.name || o.address?.fullName || 'Customer',
      totalAmount: o.totalAmount,
      status: o.status,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
      trackingNumber: o.trackingNumber,
      carrier: o.carrier
    }));

    res.json({
      totalOrders,
      totalProducts,
      totalUsers,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      paidOrdersCount: paidOrders.length,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      lowStockCount,
      outOfStockCount,
      statusCounts,
      salesTrend,
      categoryPerformance,
      topProducts,
      inventoryAlerts,
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Export entire sales order book to CSV for MNC auditing
// @route GET /api/analytics/export-csv
// @access Private/Admin
const exportSalesReportCSV = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    const headers = [
      'Order_ID',
      'Invoice_Number',
      'Date',
      'Customer_Name',
      'Customer_Email',
      'Shipping_City',
      'Shipping_Country',
      'Items_Count',
      'Total_Amount_INR',
      'Payment_Method',
      'Payment_Status',
      'Fulfillment_Status',
      'Carrier',
      'Tracking_Number'
    ];

    const rows = orders.map(o => {
      const itemsCount = (o.items || []).reduce((sum, i) => sum + (i.qty || 1), 0);
      return [
        `"${o._id}"`,
        `"${o.invoiceNumber || 'N/A'}"`,
        `"${new Date(o.createdAt).toISOString()}"`,
        `"${(o.address?.fullName || o.userId?.name || 'Customer').replace(/"/g, '""')}"`,
        `"${(o.userId?.email || 'N/A').replace(/"/g, '""')}"`,
        `"${(o.address?.city || 'N/A').replace(/"/g, '""')}"`,
        `"${(o.address?.country || 'India').replace(/"/g, '""')}"`,
        itemsCount,
        (o.totalAmount || 0).toFixed(2),
        `"${o.paymentMethod || 'Razorpay'}"`,
        `"${o.paymentStatus || 'Pending'}"`,
        `"${o.status || 'Placed'}"`,
        `"${o.carrier || 'Basketry Logistics'}"`,
        `"${o.trackingNumber || 'Pending'}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="Basketry_MNC_Sales_Report.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAdminStats, exportSalesReportCSV };
