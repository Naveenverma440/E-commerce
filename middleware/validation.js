const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('first_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('last_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Product name must be between 2 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock_quantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  body('category_id')
    .optional()
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),
  body('sku')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('SKU must not exceed 100 characters'),
  handleValidationErrors
];

const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  handleValidationErrors
];

const validateCartItem = [
  body('product_id')
    .isUUID()
    .withMessage('Product ID must be a valid UUID'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  handleValidationErrors
];

const validateOrder = [
  body('shipping_address')
    .isObject()
    .withMessage('Shipping address is required'),
  body('shipping_address.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('shipping_address.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('shipping_address.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('shipping_address.postal_code')
    .trim()
    .notEmpty()
    .withMessage('Postal code is required'),
  body('shipping_address.country')
    .trim()
    .notEmpty()
    .withMessage('Country is required'),
  body('payment_method')
    .optional()
    .isIn(['cash_on_delivery', 'credit_card', 'debit_card', 'upi'])
    .withMessage('Invalid payment method'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  handleValidationErrors
];

const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  handleValidationErrors
];

const validateOrderStatus = [
  body('status')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateProduct,
  validateCategory,
  validateCartItem,
  validateOrder,
  validateUUID,
  validatePagination,
  validateSearch,
  validateOrderStatus,
  handleValidationErrors
};