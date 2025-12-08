# Meesho Backend API

Advanced Node.js + Express + MongoDB backend for Meesho clone with three user modules: **User**, **Seller**, and **Admin**.

## 🚀 Features

- **Three User Modules**: User, Seller, Admin with role-based access control
- **Authentication**: JWT-based authentication with refresh tokens
- **Authorization**: Role-based middleware for protected routes
- **Security**: Helmet, Rate Limiting, Data Sanitization, XSS Protection
- **File Upload**: Multer + Cloudinary integration
- **Email Service**: Nodemailer for transactional emails
- **Payment Integration**: Razorpay payment gateway
- **Logging**: Winston logger for application logs
- **API Documentation**: Swagger/OpenAPI 3.0 documentation
- **JSDoc**: Comprehensive code documentation
- **Error Handling**: Centralized error handling middleware
- **Validation**: Express-validator for request validation
- **Database**: MongoDB with Mongoose ODM

## 📁 Project Structure

```
MeeshoBackend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers (business logic)
│   ├── middlewares/      # Custom middlewares
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic layer
│   ├── utils/           # Utility functions
│   ├── validators/      # Request validators
│   └── docs/            # Swagger documentation
├── uploads/             # File uploads directory
├── logs/               # Application logs
├── .env.example        # Environment variables template
├── .gitignore
├── package.json
├── server.js           # Entry point
└── README.md
```

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd MeeshoBackend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB**
```bash
# Make sure MongoDB is running locally or use MongoDB Atlas
```

5. **Run the application**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📚 API Documentation

Once the server is running, access the Swagger documentation at:
```
http://localhost:5000/api-docs
```

## 🔐 User Roles

1. **User**: Regular customers who can browse and purchase products
2. **Seller**: Merchants who can list and manage their products
3. **Admin**: Platform administrators with full access

## 🌐 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password/:token` - Reset password

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `GET /api/v1/users/orders` - Get user orders
- `POST /api/v1/users/address` - Add delivery address

### Sellers
- `GET /api/v1/sellers/dashboard` - Seller dashboard stats
- `POST /api/v1/sellers/products` - Add new product
- `GET /api/v1/sellers/products` - Get seller products
- `PUT /api/v1/sellers/products/:id` - Update product
- `DELETE /api/v1/sellers/products/:id` - Delete product
- `GET /api/v1/sellers/orders` - Get seller orders

### Admin
- `GET /api/v1/admin/users` - Get all users
- `GET /api/v1/admin/sellers` - Get all sellers
- `PUT /api/v1/admin/sellers/:id/verify` - Verify seller
- `GET /api/v1/admin/products` - Get all products
- `DELETE /api/v1/admin/products/:id` - Delete any product
- `GET /api/v1/admin/stats` - Platform statistics

## 🔧 Environment Variables

See `.env.example` for all required environment variables.

## 🧪 Testing

```bash
npm test
```

## 📝 License

ISC

## 👨‍💻 Author

Your Name
