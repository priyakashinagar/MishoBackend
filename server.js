/**
 * @fileoverview Main server entry point for Meesho Backend Application
 * @module server
 * @requires dotenv
 * @requires express
 * @requires ./src/config/database
 * @requires ./src/config/app
 */

const dotenv = require('dotenv');
const express = require('express');
const connectDB = require('./src/config/database');
const configureApp = require('./src/config/app');
const logger = require('./src/utils/logger');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Configure app middleware and routes
configureApp(app);

// Connect to MongoDB
connectDB();

// Server Configuration
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
