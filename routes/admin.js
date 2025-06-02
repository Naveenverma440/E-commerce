const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { User, Product, Order } = require('../models');

const router = express.Router();

// Simple Dashboard statistics
router.get('/dashboard', authenticate, requireAdmin, async (req, res) => {
  try {
    // Simple counts using Sequelize
    const totalCustomers = await User.count({ where: { role: 'customer' } });
    const totalProducts = await Product.count({ where: { is_active: true } });
    const totalOrders = await Order.count();

    res.json({
      success: true,
      data: {
        total_customers: totalCustomers,
        total_products: totalProducts,
        total_orders: totalOrders
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Get all orders (Admin view) - Simplified
router.get('/orders', authenticate, requireAdmin, async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [{
        model: User,
        attributes: ['first_name', 'last_name', 'email']
      }],
      limit: 10,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// Get all users - Simplified
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at'],
      limit: 20,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Toggle user active status - Simplified
router.put('/users/:id/toggle-status', authenticate, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.is_active = !user.is_active;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.is_active ? 'activated' : 'deactivated'} successfully`,
      data: { user }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

// Get all products - Simplified
router.get('/products', authenticate, requireAdmin, async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { is_active: true },
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

module.exports = router;