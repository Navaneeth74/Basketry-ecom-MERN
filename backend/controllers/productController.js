const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

// @desc Fetch all products with optional search, category, and sorting filters
// @route GET /api/products
const getProducts = async (req, res) => {
  try {
    const { category, search, stockFilter, sort } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = new RegExp(`^${category}$`, 'i');
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    if (stockFilter === 'lowStock') {
      filter.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
    } else if (stockFilter === 'outOfStock') {
      filter.stock = 0;
    } else if (stockFilter === 'inStock') {
      filter.stock = { $gt: 0 };
    }

    let query = Product.find(filter);

    if (sort === 'price_asc') {
      query = query.sort({ price: 1 });
    } else if (sort === 'price_desc') {
      query = query.sort({ price: -1 });
    } else if (sort === 'rating') {
      query = query.sort({ ratings: -1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const products = await query;
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Fetch single product by ID
// @route GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create a product
// @route POST /api/products
// @access Private/Admin
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, sku, brand, lowStockThreshold, isFeatured } = req.body;
    let imageUrl = req.body.imageUrl || '';

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
    }

    if (!imageUrl) {
      imageUrl = 'https://images.unsplash.com/photo-1544816155-12df9643f363?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';
    }

    const product = new Product({
      name,
      description,
      price: Number(price),
      category,
      stock: Number(stock),
      sku: sku ? sku.toUpperCase() : undefined,
      brand: brand || 'Basketry Studio',
      lowStockThreshold: lowStockThreshold ? Number(lowStockThreshold) : 5,
      isFeatured: Boolean(isFeatured),
      imageUrl
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update product details
// @route PUT /api/products/:id
// @access Private/Admin
const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, sku, brand, lowStockThreshold, isFeatured, imageUrl: bodyImageUrl } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name !== undefined ? name : product.name;
      product.description = description !== undefined ? description : product.description;
      product.price = price !== undefined ? Number(price) : product.price;
      product.category = category !== undefined ? category : product.category;
      product.stock = stock !== undefined ? Number(stock) : product.stock;
      if (sku) product.sku = sku.toUpperCase();
      if (brand) product.brand = brand;
      if (lowStockThreshold !== undefined) product.lowStockThreshold = Number(lowStockThreshold);
      if (isFeatured !== undefined) product.isFeatured = Boolean(isFeatured);

      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path);
        product.imageUrl = result.secure_url;
      } else if (bodyImageUrl) {
        product.imageUrl = bodyImageUrl;
      }

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Quick update stock level for inventory management
// @route PATCH /api/products/:id/stock
// @access Private/Admin
const quickUpdateStock = async (req, res) => {
  try {
    const { stock, delta } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (stock !== undefined) {
      product.stock = Math.max(0, Number(stock));
    } else if (delta !== undefined) {
      product.stock = Math.max(0, product.stock + Number(delta));
    }

    await product.save();
    res.json({ message: 'Stock updated', product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete product
// @route DELETE /api/products/:id
// @access Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  quickUpdateStock,
  deleteProduct
};
