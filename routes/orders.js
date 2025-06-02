const express = require('express');
const { authenticate, requireCustomer, requireAdmin } = require('../middleware/auth');
const { validateOrder, validateUUID, validatePagination, validateOrderStatus } = require('../middleware/validation');
const { sendOrderConfirmationEmail } = require('../services/emailService');
const { User, Product, Order, CartItem, OrderItem } = require('../models');

const router = express.Router();

// Create new order from cart - Simplified
router.post('/', authenticate, requireCustomer, async (req, res) => {
  try {
    const { shipping_address, payment_method = 'cash_on_delivery', notes } = req.body;

    // Get cart items
    const cartItems = await CartItem.findAll({
      where: { user_id: req.user.id },
      include: [Product]
    });

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Calculate total
    const totalAmount = cartItems.reduce((sum, item) =>
      sum + (item.quantity * parseFloat(item.Product.price)), 0);

    // Create order
    const order = await Order.create({
      user_id: req.user.id,
      total_amount: totalAmount,
      shipping_address: JSON.stringify(shipping_address),
      payment_method,
      notes
    });

    // Create order items
    for (const cartItem of cartItems) {
      await OrderItem.create({
        order_id: order.id,
        product_id: cartItem.product_id,
        quantity: cartItem.quantity,
        unit_price: cartItem.Product.price,
        total_price: cartItem.quantity * parseFloat(cartItem.Product.price)
      });
    }

    // Clear cart
    await CartItem.destroy({ where: { user_id: req.user.id } });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
});

// Get user's orders - Simplified
router.get('/', authenticate, requireCustomer, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.user.id },
      limit: 10,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// Get single order details - Simplified
router.get('/:id', authenticate, async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    
    // If not admin, restrict to user's own orders
    if (req.user.role !== 'admin') {
      whereClause.user_id = req.user.id;
    }

    const order = await Order.findOne({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['first_name', 'last_name', 'email']
        },
        {
          model: OrderItem,
          include: [{
            model: Product,
            attributes: ['name', 'image_url']
          }]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details'
    });
  }
});

// Update order status (Admin only) - Simplified
router.put('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

// Cancel order (Customer can cancel pending orders) - Simplified
router.put('/:id/cancel', authenticate, requireCustomer, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending orders can be cancelled'
      });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order'
    });
  }
});

module.exports = router;