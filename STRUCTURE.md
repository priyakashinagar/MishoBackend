# Meesho Backend - Complete Project Structure

```
MeeshoBackend/
│
├── src/
│   ├── config/                      # Configuration files
│   │   ├── app.js                   # Express app configuration
│   │   ├── database.js              # MongoDB connection
│   │   ├── jwt.js                   # JWT utilities
│   │   ├── multer.js                # File upload configuration
│   │   └── cloudinary.js            # Cloudinary configuration
│   │
│   ├── models/                      # Mongoose models
│   │   ├── User.js                  # User model (User, Seller, Admin)
│   │   ├── Seller.js                # Seller profile model
│   │   ├── Product.js               # Product model
│   │   ├── Category.js              # Category model
│   │   └── Order.js                 # Order model
│   │
│   ├── controllers/                 # Route controllers with JSDoc
│   │   ├── authController.js        # Authentication logic
│   │   ├── userController.js        # User operations
│   │   ├── sellerController.js      # Seller operations
│   │   ├── adminController.js       # Admin operations
│   │   ├── productController.js     # Product CRUD (in routes/productRoutes.js)
│   │   └── orderController.js       # Order management
│   │
│   ├── routes/                      # API routes
│   │   ├── authRoutes.js            # Auth routes
│   │   ├── userRoutes.js            # User routes
│   │   ├── sellerRoutes.js          # Seller routes
│   │   ├── adminRoutes.js           # Admin routes
│   │   ├── productRoutes.js         # Product routes
│   │   ├── orderRoutes.js           # Order routes
│   │   └── categoryRoutes.js        # Category routes
│   │
│   ├── middlewares/                 # Custom middlewares
│   │   ├── auth.js                  # Authentication & authorization
│   │   ├── errorHandler.js          # Global error handler
│   │   └── validator.js             # Request validation
│   │
│   ├── services/                    # Business logic layer
│   │   ├── authService.js           # Authentication services
│   │   ├── userService.js           # User services
│   │   ├── sellerService.js         # Seller services
│   │   ├── productService.js        # Product services
│   │   └── orderService.js          # Order services
│   │
│   ├── utils/                       # Utility functions
│   │   ├── logger.js                # Winston logger
│   │   ├── responseHandler.js       # Response formatters
│   │   ├── helpers.js               # Helper functions
│   │   └── emailService.js          # Email sending service
│   │
│   ├── validators/                  # Request validators
│   │   ├── authValidator.js         # Auth validation rules
│   │   ├── userValidator.js         # User validation rules
│   │   ├── productValidator.js      # Product validation rules
│   │   └── orderValidator.js        # Order validation rules
│   │
│   └── docs/                        # API documentation
│       └── swagger.js               # Swagger configuration
│
├── uploads/                         # Local file uploads (temporary)
├── logs/                            # Application logs
│   ├── error.log                    # Error logs
│   ├── combined.log                 # Combined logs
│   ├── exceptions.log               # Exception logs
│   └── rejections.log               # Rejection logs
│
├── tests/                           # Test files (optional)
│   ├── unit/                        # Unit tests
│   └── integration/                 # Integration tests
│
├── .env                             # Environment variables (create from .env.example)
├── .env.example                     # Environment variables template
├── .gitignore                       # Git ignore file
├── package.json                     # NPM dependencies
├── server.js                        # Entry point
└── README.md                        # Project documentation
```

## 📋 Models Structure

### User Model
- **Purpose**: Main user model for all three roles (User, Seller, Admin)
- **Key Fields**: name, email, phone, password, role, avatar, addresses, wishlist
- **Features**: Password hashing, email/phone verification, address management

### Seller Model
- **Purpose**: Extended profile for sellers
- **Key Fields**: shopName, businessType, KYC documents, bank details, stats, ratings
- **Features**: KYC verification, seller analytics, commission management

### Product Model
- **Purpose**: Product catalog management
- **Key Fields**: name, description, price, images, stock, ratings, reviews
- **Features**: Variants, specifications, automatic slug generation, stock tracking

### Category Model
- **Purpose**: Product categorization
- **Key Fields**: name, slug, parent, image, isActive
- **Features**: Hierarchical structure, SEO-friendly slugs

### Order Model
- **Purpose**: Order management
- **Key Fields**: orderId, user, items, payment, status, tracking
- **Features**: Status history, return management, payment tracking

## 🔐 Authentication & Authorization

### Roles
1. **User**: Regular customers
   - Browse products
   - Place orders
   - Manage profile and addresses
   - Wishlist management

2. **Seller**: Merchants
   - Add/manage products
   - View orders
   - Update order status
   - Dashboard analytics
   - KYC submission

3. **Admin**: Platform administrators
   - Manage all users and sellers
   - Verify seller KYC
   - Manage all products
   - Platform analytics
   - Order management

### Protected Routes
- `protect`: Verify JWT token
- `authorize(roles)`: Check user role
- `verifySeller`: Check seller profile exists
- `requireVerifiedSeller`: Check seller is KYC verified

## 🛠️ Middleware

### auth.js
- `protect`: JWT authentication
- `authorize`: Role-based authorization
- `optionalAuth`: Optional authentication
- `verifySeller`: Seller verification
- `requireVerifiedSeller`: Verified seller check

### errorHandler.js
- Global error handling
- MongoDB error handling
- Validation error handling
- JWT error handling
- Multer error handling

### validator.js
- Request validation using express-validator
- Async error handling wrapper

## 🔧 Configuration Files

### database.js
- MongoDB connection
- Connection event handlers
- Graceful shutdown

### jwt.js
- Access token generation
- Refresh token generation
- Token verification
- Reset token generation

### multer.js
- File upload configuration
- File type validation
- Size limits
- Multiple upload strategies

### cloudinary.js
- Image upload to cloud
- Image deletion
- Multiple image upload
- Image optimization

## 📧 Utilities

### logger.js
- Winston logger configuration
- File-based logging
- Console logging (development)
- Error, combined, exception logs

### responseHandler.js
- `sendSuccess`: Success responses
- `sendError`: Error responses
- `sendPaginatedResponse`: Paginated responses
- `sendTokenResponse`: Token responses

### helpers.js
- String generation
- OTP generation
- Pagination calculation
- Slug generation
- Currency formatting
- Validation helpers

### emailService.js
- Welcome email
- OTP email
- Password reset email
- Order confirmation email

## 📚 API Documentation

### Swagger UI
Access at: `http://localhost:5000/api-docs`

### Features
- Complete API documentation
- Interactive testing
- Request/response schemas
- Authentication support
- Code examples

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd MeeshoBackend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start MongoDB
Make sure MongoDB is running locally or configure MongoDB Atlas URI

### 4. Run Application
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 5. Access API Documentation
Open browser: `http://localhost:5000/api-docs`

## 📦 Key Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **multer**: File uploads
- **cloudinary**: Image hosting
- **nodemailer**: Email service
- **winston**: Logging
- **swagger-jsdoc**: API documentation
- **express-validator**: Request validation
- **helmet**: Security headers
- **cors**: Cross-origin support

## 🔒 Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- Data sanitization
- XSS protection
- HTTP security headers
- Input validation
- Error handling

## 📊 Features Implemented

✅ User authentication & authorization
✅ Three-tier role system (User, Seller, Admin)
✅ Product management with images
✅ Seller KYC verification
✅ Order management
✅ Category management
✅ Wishlist functionality
✅ Address management
✅ File upload (Cloudinary)
✅ Email notifications
✅ Comprehensive logging
✅ API documentation (Swagger)
✅ JSDoc code documentation
✅ Error handling
✅ Request validation
✅ Pagination
✅ Search & filters
