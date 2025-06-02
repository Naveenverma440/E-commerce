const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userResult = await query(
      'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return next(new Error('Authentication error: User not found'));
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return next(new Error('Authentication error: Account is deactivated'));
    }

    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};

const setupSocketHandlers = (io) => {
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.email} (${socket.user.role})`);

    socket.join(`user_${socket.user.id}`);

    if (socket.user.role === 'admin') {
      socket.join('admin_room');
    }

    socket.on('join_room', (roomName) => {
      if (socket.user.role === 'admin' || roomName === `user_${socket.user.id}`) {
        socket.join(roomName);
        socket.emit('joined_room', { room: roomName });
        console.log(`User ${socket.user.email} joined room: ${roomName}`);
      } else {
        socket.emit('error', { message: 'Unauthorized to join this room' });
      }
    });

    socket.on('leave_room', (roomName) => {
      socket.leave(roomName);
      socket.emit('left_room', { room: roomName });
      console.log(`User ${socket.user.email} left room: ${roomName}`);
    });

    socket.on('update_order_status', async (data) => {
      if (socket.user.role !== 'admin') {
        socket.emit('error', { message: 'Unauthorized action' });
        return;
      }

      try {
        const { order_id, status, notes } = data;

        await query(`
          UPDATE orders
          SET status = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [status, order_id]);

        await query(`
          INSERT INTO order_status_history (order_id, status, notes, created_by)
          VALUES ($1, $2, $3, $4)
        `, [order_id, status, notes, socket.user.id]);

        const orderResult = await query(
          'SELECT user_id FROM orders WHERE id = $1',
          [order_id]
        );

        if (orderResult.rows.length > 0) {
          const customerId = orderResult.rows[0].user_id;

          io.to(`user_${customerId}`).emit('order_status_updated', {
            order_id: order_id,
            status: status,
            notes: notes,
            updated_at: new Date().toISOString()
          });

          io.to('admin_room').emit('order_status_changed', {
            order_id: order_id,
            status: status,
            notes: notes,
            updated_by: `${socket.user.first_name} ${socket.user.last_name}`,
            updated_at: new Date().toISOString()
          });

          socket.emit('status_update_success', {
            order_id: order_id,
            status: status
          });
        }
      } catch (error) {
        console.error('Socket order status update error:', error);
        socket.emit('error', { message: 'Failed to update order status' });
      }
    });

    // Handle new order notifications (triggered from order creation)
    socket.on('new_order_created', (orderData) => {
      // Notify all admins about new order
      io.to('admin_room').emit('new_order', {
        order_id: orderData.order_id,
        customer_name: orderData.customer_name,
        total_amount: orderData.total_amount,
        created_at: orderData.created_at
      });
    });

    // Handle inventory updates (Admin only)
    socket.on('update_inventory', async (data) => {
      if (socket.user.role !== 'admin') {
        socket.emit('error', { message: 'Unauthorized action' });
        return;
      }

      try {
        const { product_id, stock_quantity } = data;

        // Update product stock
        const result = await query(`
          UPDATE products 
          SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING id, name, stock_quantity
        `, [stock_quantity, product_id]);

        if (result.rows.length > 0) {
          const product = result.rows[0];

          // Notify all admins about inventory update
          io.to('admin_room').emit('inventory_updated', {
            product_id: product.id,
            product_name: product.name,
            new_stock: product.stock_quantity,
            updated_by: `${socket.user.first_name} ${socket.user.last_name}`,
            updated_at: new Date().toISOString()
          });

          socket.emit('inventory_update_success', {
            product_id: product.id,
            new_stock: product.stock_quantity
          });
        }
      } catch (error) {
        console.error('Socket inventory update error:', error);
        socket.emit('error', { message: 'Failed to update inventory' });
      }
    });

    // Handle admin dashboard real-time updates
    socket.on('request_dashboard_update', async () => {
      if (socket.user.role !== 'admin') {
        socket.emit('error', { message: 'Unauthorized action' });
        return;
      }

      try {
        // Get real-time statistics
        const [pendingOrdersResult, lowStockResult] = await Promise.all([
          query('SELECT COUNT(*) as count FROM orders WHERE status = $1', ['pending']),
          query('SELECT COUNT(*) as count FROM products WHERE stock_quantity < 10 AND is_active = true')
        ]);

        socket.emit('dashboard_update', {
          pending_orders: parseInt(pendingOrdersResult.rows[0].count),
          low_stock_products: parseInt(lowStockResult.rows[0].count),
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Socket dashboard update error:', error);
        socket.emit('error', { message: 'Failed to get dashboard update' });
      }
    });

    // Handle customer cart updates
    socket.on('cart_updated', (data) => {
      // Emit back to the same user for real-time cart sync across tabs
      socket.to(`user_${socket.user.id}`).emit('cart_sync', {
        total_items: data.total_items,
        updated_at: new Date().toISOString()
      });
    });

    // Handle typing indicators for customer support (future feature)
    socket.on('typing_start', (data) => {
      socket.to(data.room).emit('user_typing', {
        user_id: socket.user.id,
        user_name: `${socket.user.first_name} ${socket.user.last_name}`,
        typing: true
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(data.room).emit('user_typing', {
        user_id: socket.user.id,
        user_name: `${socket.user.first_name} ${socket.user.last_name}`,
        typing: false
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.user.email} - Reason: ${reason}`);
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected successfully',
      user: {
        id: socket.user.id,
        name: `${socket.user.first_name} ${socket.user.last_name}`,
        role: socket.user.role
      },
      timestamp: new Date().toISOString()
    });
  });

  // Handle connection errors
  io.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
  });

  console.log('Socket.IO handlers initialized');
};

module.exports = {
  setupSocketHandlers
};