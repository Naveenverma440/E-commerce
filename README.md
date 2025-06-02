# E-Commerce Backend API

A comprehensive e-commerce backend system built with Node.js, Express.js, PostgreSQL, and Socket.IO featuring real-time notifications, JWT authentication, and Redis caching.

## 🚀 Features

### Core Features
- **User Authentication & Authorization**: JWT-based authentication with role-based access control (Customer/Admin)
- **Product Management**: Full CRUD operations for products with image upload support
- **Shopping Cart**: Add, update, remove items with real-time synchronization
- **Order Management**: Complete order lifecycle with status tracking
- **Real-time Notifications**: Socket.IO integration for live order updates
- **Email Notifications**: Automated order confirmation and status update emails
- **Admin Dashboard**: Comprehensive admin panel with analytics and management tools

### Technical Features
- **Database**: PostgreSQL with optimized schema and indexing
- **Caching**: Redis integration for improved performance (optional)
- **File Upload**: Multer integration for product image uploads
- **Validation**: Comprehensive input validation with express-validator
- **Error Handling**: Centralized error handling with detailed logging
- **Security**: Helmet, CORS, rate limiting, and input sanitization
- **Real-time**: Socket.IO for live updates and notifications

## 📋 Requirements

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Redis (optional, for caching)
- SMTP server (for email notifications)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecommerce-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=ecommerce_db
   DB_USER=postgres
   DB_PASSWORD=your_password

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d

   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password

   # Redis Configuration (optional)
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=

   # Admin Configuration
   ADMIN_EMAIL=admin@ecommerce.com
   ADMIN_PASSWORD=admin123
   ```

4. **Database Setup**
   
   Create PostgreSQL database:
   ```sql
   CREATE DATABASE ecommerce_db;
   ```

   Run migrations and seed data:
   ```bash
   npm run migrate -- --seed
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Product Endpoints

#### Get All Products
```http
GET /api/products?page=1&limit=10&q=search&category=category_id&sort=name&order=asc
```

#### Get Single Product
```http
GET /api/products/:id
```

#### Create Product (Admin)
```http
POST /api/products
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

{
  "name": "Product Name",
  "description": "Product Description",
  "price": 99.99,
  "stock_quantity": 100,
  "category_id": "category_uuid",
  "sku": "PROD-001",
  "image": <file>
}
```

#### Update Product (Admin)
```http
PUT /api/products/:id
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

#### Delete Product (Admin)
```http
DELETE /api/products/:id
Authorization: Bearer <admin_token>
```

### Cart Endpoints

#### Get Cart
```http
GET /api/cart
Authorization: Bearer <customer_token>
```

#### Add to Cart
```http
POST /api/cart/items
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "product_id": "product_uuid",
  "quantity": 2
}
```

#### Update Cart Item
```http
PUT /api/cart/items/:id
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "quantity": 3
}
```

#### Remove from Cart
```http
DELETE /api/cart/items/:id
Authorization: Bearer <customer_token>
```

### Order Endpoints

#### Create Order
```http
POST /api/orders
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "shipping_address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "USA"
  },
  "payment_method": "cash_on_delivery",
  "notes": "Optional notes"
}
```

#### Get User Orders
```http
GET /api/orders?page=1&limit=10
Authorization: Bearer <customer_token>
```

#### Get Order Details
```http
GET /api/orders/:id
Authorization: Bearer <token>
```

#### Update Order Status (Admin)
```http
PUT /api/orders/:id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "confirmed",
  "notes": "Order confirmed and processing"
}
```

### Admin Endpoints

#### Dashboard Statistics
```http
GET /api/admin/dashboard
Authorization: Bearer <admin_token>
```

#### Manage Users
```http
GET /api/admin/users?page=1&limit=20&role=customer&search=john
Authorization: Bearer <admin_token>
```

#### Manage Categories
```http
POST /api/admin/categories
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Category Name",
  "description": "Category Description"
}
```

## 🔌 Socket.IO Events

### Client Events

#### Connection
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

#### Join Room
```javascript
socket.emit('join_room', 'user_123');
```

#### Update Order Status (Admin)
```javascript
socket.emit('update_order_status', {
  order_id: 'order_uuid',
  status: 'shipped',
  notes: 'Order shipped via FedEx'
});
```

### Server Events

#### Order Status Updated
```javascript
socket.on('order_status_updated', (data) => {
  console.log('Order status updated:', data);
});
```

#### New Order (Admin)
```javascript
socket.on('new_order', (data) => {
  console.log('New order received:', data);
});
```

#### Connected
```javascript
socket.on('connected', (data) => {
  console.log('Connected to server:', data);
});
```

## 🗄️ Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `password` (VARCHAR, Hashed)
- `first_name` (VARCHAR)
- `last_name` (VARCHAR)
- `role` (ENUM: customer, admin)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

### Products Table
- `id` (UUID, Primary Key)
- `name` (VARCHAR)
- `description` (TEXT)
- `price` (DECIMAL)
- `stock_quantity` (INTEGER)
- `category_id` (UUID, Foreign Key)
- `image_url` (VARCHAR)
- `sku` (VARCHAR, Unique)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

### Orders Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `total_amount` (DECIMAL)
- `status` (ENUM: pending, confirmed, processing, shipped, delivered, cancelled)
- `shipping_address` (JSONB)
- `payment_method` (VARCHAR)
- `payment_status` (ENUM: pending, paid, failed, refunded)
- `notes` (TEXT)
- `created_at`, `updated_at` (TIMESTAMP)

## 🚀 Deployment

### Using PM2

1. **Install PM2**
   ```bash
   npm install -g pm2
   ```

2. **Create ecosystem file**
   ```javascript
   module.exports = {
     apps: [{
       name: 'ecommerce-api',
       script: 'server.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       }
     }]
   };
   ```

3. **Start application**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

## 🧪 Testing

### Manual Testing with Postman

1. Import the provided Postman collection
2. Set up environment variables:
   - `base_url`: http://localhost:3000
   - `admin_token`: (obtained from admin login)
   - `customer_token`: (obtained from customer login)

### Sample Test Flow

1. **Register/Login** as admin and customer
2. **Create categories** (admin)
3. **Create products** (admin)
4. **Browse products** (customer)
5. **Add items to cart** (customer)
6. **Place order** (customer)
7. **Update order status** (admin)
8. **Verify real-time notifications**

## 🔧 Configuration

### Email Setup (Gmail Example)

1. Enable 2-factor authentication
2. Generate app password
3. Use app password in EMAIL_PASS

### Redis Setup (Optional)

```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis
redis-server

# Test connection
redis-cli ping
```

## 📊 Performance Optimization

### Database Optimization
- Proper indexing on frequently queried columns
- Connection pooling
- Query optimization

### Caching Strategy
- Product listings cached for 1 hour
- Categories cached for 2 hours
- User sessions cached for 24 hours

### File Upload Optimization
- Image compression
- File size limits
- Allowed file types validation

## 🔒 Security Features

- **JWT Authentication** with secure secret
- **Password Hashing** using bcrypt
- **Input Validation** with express-validator
- **Rate Limiting** to prevent abuse
- **CORS Configuration** for cross-origin requests
- **Helmet** for security headers
- **SQL Injection Prevention** with parameterized queries

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL service status
   - Verify connection credentials
   - Ensure database exists

2. **Email Not Sending**
   - Verify SMTP credentials
   - Check firewall settings
   - Test email configuration

3. **Redis Connection Issues**
   - Ensure Redis server is running
   - Check Redis configuration
   - Verify network connectivity

4. **Socket.IO Not Working**
   - Check CORS configuration
   - Verify JWT token format
   - Ensure proper client connection

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Happy Coding! 🚀**