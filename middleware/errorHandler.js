const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('Error:', err);

  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { message, statusCode: 400 };
  }

  if (err.code) {
    switch (err.code) {
      case '23505':
        error = {
          message: 'Duplicate entry found',
          statusCode: 400
        };
        break;
      case '23503':
        error = {
          message: 'Referenced record not found',
          statusCode: 400
        };
        break;
      case '23502':
        error = {
          message: 'Required field missing',
          statusCode: 400
        };
        break;
      case '23514':
        error = {
          message: 'Invalid data provided',
          statusCode: 400
        };
        break;
      default:
        error = {
          message: 'Database error occurred',
          statusCode: 500
        };
    }
  }

  if (err.name === 'JsonWebTokenError') {
    error = { message: 'Invalid token', statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    error = { message: 'Token expired', statusCode: 401 };
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    error = { message: 'File too large', statusCode: 400 };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = { message: 'Unexpected file field', statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;