require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@ecommerce.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);

    const existingAdmin = await query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    
    let adminId;
    if (existingAdmin.rows.length === 0) {
      const adminResult = await query(`
        INSERT INTO users (email, password, first_name, last_name, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [adminEmail, hashedAdminPassword, 'Admin', 'User', 'admin']);
      
      adminId = adminResult.rows[0].id;
      console.log('✓ Admin user created');
    } else {
      adminId = existingAdmin.rows[0].id;
      console.log('✓ Admin user already exists');
    }

    const customerEmail = 'customer@example.com';
    const customerPassword = 'customer123';
    const hashedCustomerPassword = await bcrypt.hash(customerPassword, 12);

    const existingCustomer = await query('SELECT id FROM users WHERE email = $1', [customerEmail]);
    
    let customerId;
    if (existingCustomer.rows.length === 0) {
      const customerResult = await query(`
        INSERT INTO users (email, password, first_name, last_name, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [customerEmail, hashedCustomerPassword, 'John', 'Doe', 'customer']);
      
      customerId = customerResult.rows[0].id;
      console.log('✓ Sample customer created');
    } else {
      customerId = existingCustomer.rows[0].id;
      console.log('✓ Sample customer already exists');
    }

    const categories = [
      { name: 'Electronics', description: 'Electronic devices and gadgets' },
      { name: 'Clothing', description: 'Fashion and apparel' },
      { name: 'Books', description: 'Books and educational materials' },
      { name: 'Home & Garden', description: 'Home improvement and gardening supplies' },
      { name: 'Sports', description: 'Sports equipment and accessories' }
    ];

    const categoryIds = {};
    for (const category of categories) {
      const existingCategory = await query('SELECT id FROM categories WHERE name = $1', [category.name]);
      
      if (existingCategory.rows.length === 0) {
        const result = await query(`
          INSERT INTO categories (name, description)
          VALUES ($1, $2)
          RETURNING id
        `, [category.name, category.description]);
        
        categoryIds[category.name] = result.rows[0].id;
        console.log(`✓ Category "${category.name}" created`);
      } else {
        categoryIds[category.name] = existingCategory.rows[0].id;
        console.log(`✓ Category "${category.name}" already exists`);
      }
    }

    const products = [
      {
        name: 'Smartphone Pro Max',
        description: 'Latest flagship smartphone with advanced features',
        price: 999.99,
        stock_quantity: 50,
        category: 'Electronics',
        sku: 'PHONE-001'
      },
      {
        name: 'Wireless Headphones',
        description: 'Premium noise-cancelling wireless headphones',
        price: 299.99,
        stock_quantity: 100,
        category: 'Electronics',
        sku: 'AUDIO-001'
      },
      {
        name: 'Laptop Computer',
        description: 'High-performance laptop for work and gaming',
        price: 1299.99,
        stock_quantity: 25,
        category: 'Electronics',
        sku: 'COMP-001'
      },
      {
        name: 'Cotton T-Shirt',
        description: 'Comfortable 100% cotton t-shirt',
        price: 29.99,
        stock_quantity: 200,
        category: 'Clothing',
        sku: 'CLOTH-001'
      },
      {
        name: 'Denim Jeans',
        description: 'Classic blue denim jeans',
        price: 79.99,
        stock_quantity: 150,
        category: 'Clothing',
        sku: 'CLOTH-002'
      },
      {
        name: 'Programming Book',
        description: 'Complete guide to modern web development',
        price: 49.99,
        stock_quantity: 75,
        category: 'Books',
        sku: 'BOOK-001'
      },
      {
        name: 'Coffee Maker',
        description: 'Automatic drip coffee maker with timer',
        price: 89.99,
        stock_quantity: 40,
        category: 'Home & Garden',
        sku: 'HOME-001'
      },
      {
        name: 'Garden Tools Set',
        description: 'Complete set of essential gardening tools',
        price: 129.99,
        stock_quantity: 30,
        category: 'Home & Garden',
        sku: 'GARDEN-001'
      },
      {
        name: 'Basketball',
        description: 'Official size basketball for indoor/outdoor use',
        price: 39.99,
        stock_quantity: 80,
        category: 'Sports',
        sku: 'SPORT-001'
      },
      {
        name: 'Yoga Mat',
        description: 'Non-slip yoga mat for exercise and meditation',
        price: 24.99,
        stock_quantity: 120,
        category: 'Sports',
        sku: 'SPORT-002'
      }
    ];

    for (const product of products) {
      const existingProduct = await query('SELECT id FROM products WHERE sku = $1', [product.sku]);
      
      if (existingProduct.rows.length === 0) {
        await query(`
          INSERT INTO products (name, description, price, stock_quantity, category_id, sku)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          product.name,
          product.description,
          product.price,
          product.stock_quantity,
          categoryIds[product.category],
          product.sku
        ]);
        
        console.log(`✓ Product "${product.name}" created`);
      } else {
        console.log(`✓ Product "${product.name}" already exists`);
      }
    }

    // Create a sample order for the customer
    const existingOrder = await query('SELECT id FROM orders WHERE user_id = $1', [customerId]);
    
    if (existingOrder.rows.length === 0) {
      const sampleShippingAddress = {
        street: '123 Main Street',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
        country: 'USA'
      };

      // Get some products for the order
      const productsForOrder = await query(`
        SELECT id, name, price FROM products 
        WHERE sku IN ('PHONE-001', 'AUDIO-001') 
        LIMIT 2
      `);

      if (productsForOrder.rows.length > 0) {
        const totalAmount = productsForOrder.rows.reduce((sum, product) => sum + parseFloat(product.price), 0);

        const orderResult = await query(`
          INSERT INTO orders (user_id, total_amount, shipping_address, payment_method, status)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [customerId, totalAmount, JSON.stringify(sampleShippingAddress), 'cash_on_delivery', 'confirmed']);

        const orderId = orderResult.rows[0].id;

        // Add order items
        for (const product of productsForOrder.rows) {
          await query(`
            INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
            VALUES ($1, $2, $3, $4, $5)
          `, [orderId, product.id, 1, product.price, product.price]);
        }

        // Add order status history
        await query(`
          INSERT INTO order_status_history (order_id, status, notes, created_by)
          VALUES ($1, $2, $3, $4)
        `, [orderId, 'confirmed', 'Sample order created during seeding', adminId]);

        console.log('✓ Sample order created');
      }
    } else {
      console.log('✓ Sample order already exists');
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\nSample credentials:');
    console.log(`Admin: ${adminEmail} / ${adminPassword}`);
    console.log(`Customer: ${customerEmail} / ${customerPassword}`);
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding process failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };