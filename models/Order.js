const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  },
  shipping_address: {
    type: DataTypes.JSONB
  },
  payment_method: {
    type: DataTypes.STRING,
    defaultValue: 'cash_on_delivery'
  },
  payment_status: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Order;