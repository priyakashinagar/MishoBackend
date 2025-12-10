/**
 * @fileoverview Application configuration and middleware setup
 * @module config/app
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../docs/swagger');
const errorHandler = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const path = require('path');

// Import routes
const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/userRoutes');
const sellerRoutes = require('../routes/sellerRoutes');
const adminRoutes = require('../routes/adminRoutes');
const productRoutes = require('../routes/productRoutes');
const orderRoutes = require('../routes/orderRoutes');
const categoryRoutes = require('../routes/categoryRoutes');
const earningsRoutes = require('../routes/earningsRoutes');
const cartRoutes = require('../routes/cartRoutes');
const wishlistRoutes = require('../routes/wishlistRoutes');
const ratingRoutes = require('../routes/ratingRoutes');
const catalogRoutes = require('../routes/catalogRoutes');
const inventoryRoutes = require('../routes/inventoryRoutes');
const paymentRoutes = require('../routes/paymentRoutes');
const warehouseRoutes = require('../routes/warehouseRoutes');
const claimRoutes = require('../routes/claimRoutes');
const supportRoutes = require('../routes/supportRoutes');
const qualityRoutes = require('../routes/qualityRoutes');
const pricingRoutes = require('../routes/pricingRoutes');
const kycRoutes = require('../routes/kycRoutes');

/**
 * Configure Express application with middleware and routes
 * @param {express.Application} app - Express application instance
 */
const configureApp = (app) => {
  // Trust proxy
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet());
  
  // CORS configuration - Allow multiple origins
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5000', // Allow Swagger UI
    process.env.CLIENT_URL
  ].filter(Boolean);

  app.use(cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests, or Swagger UI)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // Also allow same-origin requests (Swagger UI on same domain)
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Body parser middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cookie parser
  app.use(cookieParser());

  // Data sanitization against NoSQL injection
  app.use(mongoSanitize());

  // Compression middleware
  app.use(compression());

  // Serve static files from uploads directory with CORS headers
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  }, express.static(path.join(__dirname, '../../uploads')));

  // Logging middleware
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim())
      }
    }));
  }

  // Rate limiting - More lenient for development
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000, // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // limit each IP to 1000 requests per minute
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting in development mode
    skip: (req) => process.env.NODE_ENV === 'development',
  });
  app.use('/api', limiter);

  // API Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Meesho API Docs',
  }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  const API_VERSION = process.env.API_VERSION || 'v1';
  app.use(`/api/${API_VERSION}/auth`, authRoutes);
  app.use(`/api/${API_VERSION}/users`, userRoutes);
  app.use(`/api/${API_VERSION}/sellers`, sellerRoutes);
  app.use(`/api/${API_VERSION}/admin`, adminRoutes);
  app.use(`/api/${API_VERSION}/products`, productRoutes);
  app.use(`/api/${API_VERSION}/orders`, orderRoutes);
  app.use(`/api/${API_VERSION}/categories`, categoryRoutes);
  app.use(`/api/${API_VERSION}/earnings`, earningsRoutes);
  app.use(`/api/${API_VERSION}/cart`, cartRoutes);
  app.use(`/api/${API_VERSION}/wishlist`, wishlistRoutes);
  app.use(`/api/${API_VERSION}/rating`, ratingRoutes);
  app.use(`/api/${API_VERSION}/inventory`, inventoryRoutes);
  app.use(`/api/${API_VERSION}/payments`, paymentRoutes);
  app.use(`/api/${API_VERSION}/warehouses`, warehouseRoutes);
  app.use(`/api/${API_VERSION}/claims`, claimRoutes);
  app.use(`/api/${API_VERSION}/support`, supportRoutes);
  app.use(`/api/${API_VERSION}/quality`, qualityRoutes);
  app.use(`/api/${API_VERSION}/pricing`, pricingRoutes);
  app.use(`/api/${API_VERSION}/kyc`, kycRoutes);
  app.use(`/api/catalog`, catalogRoutes);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`,
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);
};

module.exports = configureApp;
