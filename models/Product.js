const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  category_id: {
    type: DataTypes.UUID
  },
  image_url: {
    type: DataTypes.STRING
  },
  sku: {
    type: DataTypes.STRING
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Product;