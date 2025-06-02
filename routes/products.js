const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');
const { validateProduct, validateUUID, validatePagination, validateSearch } = require('../middleware/validation');
const { Product, Category } = require('../models');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = 'uploads/products';
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all products - Simplified
router.get('/', optionalAuth, async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { is_active: true },
      include: [{
        model: Category,
        attributes: ['id', 'name']
      }],
      limit: 20,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: { products }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
});

// Get single product by ID - Simplified
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, is_active: true },
      include: [{
        model: Category,
        attributes: ['id', 'name']
      }]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
});

// Create new product (Admin only) - Simplified
router.post('/', authenticate, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, stock_quantity, category_id, sku } = req.body;
    const image_url = req.file ? `/uploads/products/${req.file.filename}` : null;

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      stock_quantity: parseInt(stock_quantity),
      category_id: category_id || null,
      image_url,
      sku: sku || null
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Create product error:', error);
    
    // Clean up uploaded file if product creation failed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to delete uploaded file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
});

// Update product (Admin only) - Simplified
router.put('/:id', authenticate, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, stock_quantity, category_id, sku } = req.body;

    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update product fields
    product.name = name;
    product.description = description;
    product.price = parseFloat(price);
    product.stock_quantity = parseInt(stock_quantity);
    product.category_id = category_id || null;
    product.sku = sku || null;

    if (req.file) {
      product.image_url = `/uploads/products/${req.file.filename}`;
    }

    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
});

// Delete product (Admin only) - Simplified
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Soft delete
    product.is_active = false;
    await product.save();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
});

// Get product categories - Simplified
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'description', 'created_at'],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

module.exports = router;