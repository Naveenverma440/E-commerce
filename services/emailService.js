const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

const sendOrderConfirmationEmail = async (customerEmail, order, orderItems) => {
  try {
    const transporter = createTransporter();

    const orderItemsHtml = orderItems.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${item.product_name}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          $${parseFloat(item.unit_price).toFixed(2)}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          $${parseFloat(item.total_price).toFixed(2)}
        </td>
      </tr>
    `).join('');

    const shippingAddress = order.shipping_address;
    const addressHtml = `
      ${shippingAddress.street}<br>
      ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postal_code}<br>
      ${shippingAddress.country}
    `;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .order-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table th { background-color: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; }
          .table td { padding: 10px; border-bottom: 1px solid #eee; }
          .total { font-weight: bold; font-size: 18px; color: #007bff; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
            <p>Thank you for your order!</p>
          </div>
          
          <div class="content">
            <div class="order-details">
              <h2>Order Details</h2>
              <p><strong>Order ID:</strong> ${order.id}</p>
              <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
              <p><strong>Payment Method:</strong> ${order.payment_method.replace('_', ' ').toUpperCase()}</p>
            </div>

            <div class="order-details">
              <h2>Items Ordered</h2>
              <table class="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style="text-align: center;">Quantity</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderItemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding: 15px; text-align: right; font-weight: bold;">
                      Total Amount:
                    </td>
                    <td style="padding: 15px; text-align: right;" class="total">
                      $${parseFloat(order.total_amount).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div class="order-details">
              <h2>Shipping Address</h2>
              <p>${addressHtml}</p>
            </div>

            ${order.notes ? `
            <div class="order-details">
              <h2>Order Notes</h2>
              <p>${order.notes}</p>
            </div>
            ` : ''}

            <div class="order-details">
              <h2>What's Next?</h2>
              <p>We've received your order and will begin processing it shortly. You'll receive another email when your order ships.</p>
              <p>If you have any questions about your order, please contact our customer support team.</p>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for shopping with us!</p>
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"E-Commerce Store" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `Order Confirmation - Order #${order.id}`,
      html: emailHtml
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    throw error;
  }
};

// Send order status update email
const sendOrderStatusUpdateEmail = async (customerEmail, order, newStatus, notes) => {
  try {
    const transporter = createTransporter();

    const statusMessages = {
      confirmed: 'Your order has been confirmed and is being prepared.',
      processing: 'Your order is currently being processed.',
      shipped: 'Great news! Your order has been shipped.',
      delivered: 'Your order has been delivered successfully.',
      cancelled: 'Your order has been cancelled.'
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .status-update { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #28a745; }
          .order-info { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Status Update</h1>
            <p>Your order status has been updated</p>
          </div>
          
          <div class="content">
            <div class="status-update">
              <h2>Status: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</h2>
              <p>${statusMessages[newStatus] || 'Your order status has been updated.'}</p>
              ${notes ? `<p><strong>Additional Notes:</strong> ${notes}</p>` : ''}
            </div>

            <div class="order-info">
              <h2>Order Information</h2>
              <p><strong>Order ID:</strong> ${order.id}</p>
              <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
              <p><strong>Total Amount:</strong> $${parseFloat(order.total_amount).toFixed(2)}</p>
            </div>

            <div class="order-info">
              <p>You can track your order status by logging into your account on our website.</p>
              <p>If you have any questions, please don't hesitate to contact our customer support team.</p>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for shopping with us!</p>
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"E-Commerce Store" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `Order Status Update - Order #${order.id}`,
      html: emailHtml
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order status update email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send order status update email:', error);
    throw error;
  }
};

// Send welcome email for new users
const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    const transporter = createTransporter();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to E-Commerce Store</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .welcome-message { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to E-Commerce Store!</h1>
            <p>We're excited to have you join us</p>
          </div>
          
          <div class="content">
            <div class="welcome-message">
              <h2>Hello ${userName}!</h2>
              <p>Thank you for creating an account with us. You're now part of our community and can enjoy:</p>
              <ul>
                <li>Easy and secure shopping experience</li>
                <li>Order tracking and history</li>
                <li>Exclusive offers and promotions</li>
                <li>Fast checkout process</li>
              </ul>
              <p>Start exploring our products and find something you love!</p>
            </div>
          </div>

          <div class="footer">
            <p>Happy shopping!</p>
            <p>The E-Commerce Store Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"E-Commerce Store" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Welcome to E-Commerce Store!',
      html: emailHtml
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
};

// Test email configuration
const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};

module.exports = {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendWelcomeEmail,
  testEmailConfiguration
};