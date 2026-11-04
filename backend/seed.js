const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const importData = async () => {
  try {
    await User.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const adminUser = await User.create({
      name: 'Navaneeth S (Admin)',
      email: 'admin@basketry.com',
      password: hashedPassword,
      role: 'admin'
    });

    const customerUser = await User.create({
      name: 'Priya Sharma',
      email: 'customer@basketry.com',
      password: hashedPassword,
      role: 'user'
    });

    const products = [
      {
        name: 'Wireless Noise-Cancelling Headphones',
        description: 'Immersive sound experience with advanced active noise cancellation and 40h battery.',
        price: 3499.00,
        category: 'Electronics',
        stock: 14,
        sku: 'BSK-ELEC-101',
        brand: 'SonicAura',
        lowStockThreshold: 5,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        ratings: 4.8,
        numReviews: 24,
        isFeatured: true
      },
      {
        name: 'Minimalist Scandinavian Woven Chair',
        description: 'A stylish and comfortable addition to any contemporary living room or study space.',
        price: 4999.00,
        category: 'Furniture',
        stock: 4, // Low stock trigger
        sku: 'BSK-FURN-202',
        brand: 'Nordic Weave',
        lowStockThreshold: 5,
        imageUrl: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        ratings: 4.6,
        numReviews: 12,
        isFeatured: true
      },
      {
        name: 'Professional 4K Mirrorless Studio Camera',
        description: 'Capture stunning moments with high-resolution clarity, dual card slots, and image stabilization.',
        price: 24999.00,
        category: 'Electronics',
        stock: 6,
        sku: 'BSK-ELEC-303',
        brand: 'OpticPro',
        lowStockThreshold: 3,
        imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        ratings: 4.9,
        numReviews: 50,
        isFeatured: true
      },
      {
        name: 'Organic Cotton Canvas Sneakers',
        description: 'Versatile, breathable and comfortable, a staple for any casual outing and everyday commute.',
        price: 1899.00,
        category: 'Clothing',
        stock: 28,
        sku: 'BSK-CLOT-404',
        brand: 'UrbanStep',
        lowStockThreshold: 5,
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        ratings: 4.5,
        numReviews: 89
      },
      {
        name: 'Handwoven Natural Seagrass Storage Basket',
        description: 'Artisanal wicker storage basket with sturdy reinforced carry handles for organized living.',
        price: 1299.00,
        category: 'Home Decor',
        stock: 35,
        sku: 'BSK-HOME-505',
        brand: 'Basketry Studio',
        lowStockThreshold: 8,
        imageUrl: 'https://images.unsplash.com/photo-1595867818082-083862f3d630?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        ratings: 4.9,
        numReviews: 62,
        isFeatured: true
      },
      {
        name: 'Ceramic Matte Pour-Over Coffee Carafe',
        description: 'Artisan handcrafted heat-resistant ceramic dripper with dual micro-mesh stainless filter.',
        price: 1499.00,
        category: 'Kitchenware',
        stock: 2, // Low stock
        sku: 'BSK-KITC-606',
        brand: 'BrewMaster',
        lowStockThreshold: 5,
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        ratings: 4.7,
        numReviews: 31
      },
      {
        name: 'Vintage Genuine Leather Messenger Bag',
        description: 'Full-grain vintage oil wax leather with padded 15-inch laptop compartment and brass hardware.',
        price: 3899.00,
        category: 'Clothing',
        stock: 12,
        sku: 'BSK-CLOT-707',
        brand: 'Heritage Craft',
        lowStockThreshold: 4,
        imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        ratings: 4.8,
        numReviews: 44
      },
      {
        name: 'Architectural Geometric Ceramic Planter',
        description: 'Sculptural indoor planter with built-in drainage tray, made from premium glazed stoneware.',
        price: 799.00,
        category: 'Home Decor',
        stock: 0, // Out of stock demo
        sku: 'BSK-HOME-808',
        brand: 'Terra Living',
        lowStockThreshold: 5,
        imageUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        ratings: 4.4,
        numReviews: 19
      }
    ];

    const createdProducts = await Product.insertMany(products);

    // Seed realistic sample orders for MNC dashboard demo
    const sampleOrders = [
      {
        userId: customerUser._id,
        items: [
          {
            productId: createdProducts[0]._id,
            name: createdProducts[0].name,
            qty: 1,
            price: createdProducts[0].price
          },
          {
            productId: createdProducts[4]._id,
            name: createdProducts[4].name,
            qty: 2,
            price: createdProducts[4].price
          }
        ],
        totalAmount: createdProducts[0].price + (createdProducts[4].price * 2),
        paymentAmountPaise: (createdProducts[0].price + (createdProducts[4].price * 2)) * 100,
        address: {
          fullName: 'Priya Sharma',
          street: '42 MG Road, Indiranagar',
          city: 'Bangalore',
          postalCode: '560038',
          country: 'India'
        },
        paymentId: 'PAY_MOCK_DEMO_98124',
        paymentMethod: 'Razorpay Gateway',
        paymentStatus: 'Paid',
        status: 'Shipped',
        trackingNumber: 'BSK-TRK-782194',
        carrier: 'Basketry Express Logistics',
        invoiceNumber: 'INV-2026-00102',
        dispatchHub: 'Bangalore Central Fulfillment Center',
        statusHistory: [
          {
            status: 'Placed',
            changedAt: new Date(Date.now() - 3 * 86400000),
            location: 'Central Fulfillment Hub, Bangalore',
            note: 'Order placed by customer'
          },
          {
            status: 'Confirmed',
            changedAt: new Date(Date.now() - 2.5 * 86400000),
            location: 'Order Verification Desk',
            note: 'Payment verified and confirmed'
          },
          {
            status: 'Processing',
            changedAt: new Date(Date.now() - 2 * 86400000),
            location: 'Warehouse Aisle B-4',
            note: 'Items picked and packaged'
          },
          {
            status: 'Shipped',
            changedAt: new Date(Date.now() - 1 * 86400000),
            location: 'Interstate Hub Mumbai',
            note: 'In transit with Basketry Express Logistics'
          }
        ]
      },
      {
        userId: customerUser._id,
        items: [
          {
            productId: createdProducts[1]._id,
            name: createdProducts[1].name,
            qty: 1,
            price: createdProducts[1].price
          }
        ],
        totalAmount: createdProducts[1].price,
        paymentAmountPaise: createdProducts[1].price * 100,
        address: {
          fullName: 'Priya Sharma',
          street: '42 MG Road, Indiranagar',
          city: 'Bangalore',
          postalCode: '560038',
          country: 'India'
        },
        paymentId: 'PAY_MOCK_DEMO_44129',
        paymentMethod: 'Instant Sandbox Gateway',
        paymentStatus: 'Paid',
        status: 'Delivered',
        trackingNumber: 'BSK-TRK-619283',
        carrier: 'Basketry Express Logistics',
        invoiceNumber: 'INV-2026-00098',
        dispatchHub: 'Bangalore South Station',
        statusHistory: [
          {
            status: 'Placed',
            changedAt: new Date(Date.now() - 6 * 86400000),
            location: 'Central Fulfillment Hub',
            note: 'Order placed'
          },
          {
            status: 'Confirmed',
            changedAt: new Date(Date.now() - 5 * 86400000),
            location: 'Central Fulfillment Hub',
            note: 'Payment verified'
          },
          {
            status: 'Processing',
            changedAt: new Date(Date.now() - 4 * 86400000),
            location: 'Sorting Hub',
            note: 'Packaging complete'
          },
          {
            status: 'Shipped',
            changedAt: new Date(Date.now() - 3 * 86400000),
            location: 'Transit Station',
            note: 'Handed to carrier'
          },
          {
            status: 'Out for Delivery',
            changedAt: new Date(Date.now() - 2 * 86400000),
            location: 'Local Delivery Van #BSK-11',
            note: 'Courier agent on route'
          },
          {
            status: 'Delivered',
            changedAt: new Date(Date.now() - 1.5 * 86400000),
            location: 'Customer Doorstep, Bangalore',
            note: 'Delivered and signed by recipient'
          }
        ]
      }
    ];

    await Order.insertMany(sampleOrders);

    console.log('✅ Basketry Data Seeded Successfully!');
    console.log(`👤 Admin: admin@basketry.com | Password: password123`);
    console.log(`👤 Customer: customer@basketry.com | Password: password123`);
    console.log(`📦 Seeded ${createdProducts.length} Products & ${sampleOrders.length} Sample Orders`);
    console.log('👨‍💻 Lead Developer: Navaneeth S');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error with data import: ${error.message}`);
    process.exit(1);
  }
};

importData();
