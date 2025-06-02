const express = require('express');
const { authenticate, requireCustomer } = require('../middleware/auth');
const { validateCartItem, validateUUID } = require('../middleware/validation');
const { CartItem, Product } = require('../models');

const router = express.Router();

// Get user's cart - Simplified
router.get('/', authenticate, requireCustomer, async (req, res) => {
  try {
    const cartItems = await CartItem.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: Product,
        where: { is_active: true },
        attributes: ['id', 'name', 'description', 'price', 'stock_quantity', 'image_url']
      }],
      order: [['created_at', 'DESC']]
    });

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) =>
      sum + (item.quantity * parseFloat(item.Product.price)), 0);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      success: true,
      data: {
        cart_items: cartItems,
        summary: {
          total_items: totalItems,
          subtotal: subtotal.toFixed(2),
          currency: 'USD'
        }
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart'
    });
  }
});

// Add item to cart - Simplified
router.post('/items', authenticate, requireCustomer, async (req, res) => {
  try {
    const { product_id, quantity } = req.body;

    // Check product availability
    const product = await Product.findByPk(product_id);
    if (!product || !product.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Product not found or not available'
      });
    }

    if (product.stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${product.stock_quantity} items available`
      });
    }

    // Check if item already exists in cart
    const existingCartItem = await CartItem.findOne({
      where: { user_id: req.user.id, product_id }
    });

    let cartItem;
    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + quantity;
      if (product.stock_quantity < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Only ${product.stock_quantity} items available`
        });
      }
      existingCartItem.quantity = newQuantity;
      cartItem = await existingCartItem.save();
    } else {
      cartItem = await CartItem.create({
        user_id: req.user.id,
        product_id,
        quantity
      });
    }

    res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: { cart_item: cartItem }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart'
    });
  }
});

// Update cart item quantity - Simplified
router.put('/items/:id', authenticate, requireCustomer, async (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer'
      });
    }

    const cartItem = await CartItem.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [Product]
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    if (cartItem.Product.stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${cartItem.Product.stock_quantity} items available`
      });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    res.json({
      success: true,
      message: 'Cart item updated successfully',
      data: { cart_item: cartItem }
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item'
    });
  }
});

// Remove item from cart - Simplified
router.delete('/items/:id', authenticate, requireCustomer, async (req, res) => {
  try {
    const deleted = await CartItem.destroy({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart'
    });
  }
});

// Clear entire cart - Simplified
router.delete('/', authenticate, requireCustomer, async (req, res) => {
  try {
    await CartItem.destroy({ where: { user_id: req.user.id } });

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart'
    });
  }
});

// Get cart item count - Simplified
router.get('/count', authenticate, requireCustomer, async (req, res) => {
  try {
    const cartItems = await CartItem.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Product, where: { is_active: true } }]
    });

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      success: true,
      data: { total_items: totalItems }
    });
  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cart count'
    });
  }
});

module.exports = router;