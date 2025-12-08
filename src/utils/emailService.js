/**
 * @fileoverview Email service using Nodemailer
 * @module utils/emailService
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * Create email transporter
 * @returns {nodemailer.Transporter} Email transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

/**
 * Send email
 * @async
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @returns {Promise<Object>} Send result
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Email sending failed: ${error.message}`);
    throw error;
  }
};

/**
 * Send welcome email
 * @async
 * @param {string} email - User email
 * @param {string} name - User name
 * @returns {Promise<Object>} Send result
 */
const sendWelcomeEmail = async (email, name) => {
  const subject = 'Welcome to Meesho!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #8B3A62;">Welcome to Meesho, ${name}!</h2>
      <p>Thank you for joining us. We're excited to have you on board.</p>
      <p>Start exploring amazing products and deals on our platform.</p>
      <a href="${process.env.CLIENT_URL}" style="display: inline-block; padding: 10px 20px; background-color: #8B3A62; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
        Start Shopping
      </a>
      <p style="margin-top: 30px; color: #666;">Best regards,<br>Team Meesho</p>
    </div>
  `;
  const text = `Welcome to Meesho, ${name}! Thank you for joining us.`;

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send OTP email
 * @async
 * @param {string} email - User email
 * @param {string} otp - OTP code
 * @returns {Promise<Object>} Send result
 */
const sendOTPEmail = async (email, otp) => {
  const subject = 'Your Verification OTP';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #8B3A62;">Email Verification</h2>
      <p>Your OTP for email verification is:</p>
      <h1 style="color: #8B3A62; letter-spacing: 5px;">${otp}</h1>
      <p>This OTP is valid for 10 minutes.</p>
      <p style="color: #666;">If you didn't request this, please ignore this email.</p>
    </div>
  `;
  const text = `Your OTP for email verification is: ${otp}. Valid for 10 minutes.`;

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send password reset email
 * @async
 * @param {string} email - User email
 * @param {string} resetUrl - Password reset URL
 * @returns {Promise<Object>} Send result
 */
const sendPasswordResetEmail = async (email, resetUrl) => {
  const subject = 'Password Reset Request';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #8B3A62;">Password Reset</h2>
      <p>You requested to reset your password. Click the button below to reset it:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #8B3A62; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
        Reset Password
      </a>
      <p style="margin-top: 20px;">This link is valid for 1 hour.</p>
      <p style="color: #666;">If you didn't request this, please ignore this email.</p>
    </div>
  `;
  const text = `Reset your password using this link: ${resetUrl}. Valid for 1 hour.`;

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send order confirmation email
 * @async
 * @param {string} email - User email
 * @param {Object} orderDetails - Order details
 * @returns {Promise<Object>} Send result
 */
const sendOrderConfirmationEmail = async (email, orderDetails) => {
  const subject = `Order Confirmation - ${orderDetails.orderId}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #8B3A62;">Order Confirmed!</h2>
      <p>Thank you for your order. Your order ID is: <strong>${orderDetails.orderId}</strong></p>
      <p>Total Amount: ₹${orderDetails.totalAmount}</p>
      <p>We'll send you an update when your order is shipped.</p>
      <a href="${process.env.CLIENT_URL}/orders/${orderDetails.orderId}" style="display: inline-block; padding: 10px 20px; background-color: #8B3A62; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
        Track Order
      </a>
    </div>
  `;
  const text = `Order confirmed! Order ID: ${orderDetails.orderId}. Total: ₹${orderDetails.totalAmount}`;

  return sendEmail({ to: email, subject, text, html });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
};
