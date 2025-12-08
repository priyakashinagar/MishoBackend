# 🚀 Quick Start Guide - Meesho Backend

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Installation Steps

### 1. Navigate to Backend Directory
```bash
cd MeeshoBackend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
```bash
# Copy the example env file
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/meesho

# JWT
JWT_SECRET=your_secret_key_here_change_in_production
JWT_EXPIRE=7d

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Cloudinary (Optional - for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Client URL
CLIENT_URL=http://localhost:5173
```

### 4. Start MongoDB

**Option A: Local MongoDB**
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

**Option B: MongoDB Atlas**
- Update `MONGODB_URI` in `.env` with your Atlas connection string

### 5. Run the Application

**Development Mode (with auto-restart)**
```bash
npm run dev
```

**Production Mode**
```bash
npm start
```

### 6. Verify Installation

Open your browser and visit:
- **Health Check**: http://localhost:5000/health
- **API Documentation**: http://localhost:5000/api-docs

You should see:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 📝 Testing the API

### 1. Register a User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "password123",
    "role": "user"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

Response will include a JWT token:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": { ... }
  }
}
```

### 3. Access Protected Route
```bash
curl -X GET http://localhost:5000/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🎯 Available Scripts

```bash
# Start development server with nodemon
npm run dev

# Start production server
npm start

# Run tests (when implemented)
npm test

# Run linter
npm run lint

# Generate API documentation
npm run swagger
```

## 📚 API Endpoints Overview

### Authentication (`/api/v1/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /refresh-token` - Refresh access token
- `POST /forgot-password` - Request password reset
- `GET /me` - Get current user

### Users (`/api/v1/users`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update profile
- `POST /addresses` - Add address
- `GET /orders` - Get user orders
- `GET /wishlist` - Get wishlist
- `POST /wishlist/:productId` - Add to wishlist

### Sellers (`/api/v1/sellers`)
- `GET /dashboard` - Seller dashboard
- `GET /profile` - Get seller profile
- `PUT /profile` - Update profile
- `POST /kyc` - Submit KYC
- `POST /bank-details` - Add bank details
- `GET /products` - Get seller products
- `GET /orders` - Get seller orders

### Admin (`/api/v1/admin`)
- `GET /dashboard` - Admin dashboard
- `GET /users` - Get all users
- `GET /sellers` - Get all sellers
- `PUT /sellers/:id/verify` - Verify seller
- `GET /products` - Get all products
- `GET /orders` - Get all orders
- `GET /analytics` - Platform analytics

### Products (`/api/v1/products`)
- `GET /` - Get all products (with filters)
- `GET /:id` - Get single product
- `POST /` - Create product (Seller)
- `PUT /:id` - Update product (Seller)
- `DELETE /:id` - Delete product (Seller)

### Categories (`/api/v1/categories`)
- `GET /` - Get all categories
- `GET /:id` - Get category by ID
- `POST /` - Create category (Admin)
- `PUT /:id` - Update category (Admin)
- `DELETE /:id` - Delete category (Admin)

## 🔐 User Roles

### 1. User (Regular Customer)
```json
{
  "name": "Customer Name",
  "email": "customer@example.com",
  "phone": "9876543210",
  "password": "password123",
  "role": "user"
}
```

### 2. Seller (Merchant)
```json
{
  "name": "Seller Name",
  "email": "seller@example.com",
  "phone": "9876543211",
  "password": "password123",
  "role": "seller"
}
```

### 3. Admin (Platform Administrator)
```json
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "phone": "9876543212",
  "password": "password123",
  "role": "admin"
}
```

## 🛠️ Troubleshooting

### MongoDB Connection Error
```
Error: Could not connect to MongoDB
```
**Solution**: 
- Check if MongoDB is running
- Verify MONGODB_URI in `.env`
- Check firewall settings

### Port Already in Use
```
Error: Port 5000 is already in use
```
**Solution**: 
- Change PORT in `.env` file
- Or kill the process using port 5000

### JWT Secret Error
```
Error: JWT_SECRET not defined
```
**Solution**: 
- Add JWT_SECRET to `.env` file

### Email Sending Error
```
Error: Email could not be sent
```
**Solution**: 
- Verify SMTP credentials in `.env`
- For Gmail, use App Password (not regular password)
- Enable "Less secure app access" or use OAuth2

## 📖 Additional Resources

- **Swagger Documentation**: http://localhost:5000/api-docs
- **Project Structure**: See `STRUCTURE.md`
- **Main README**: See `README.md`

## 🎓 Next Steps

1. ✅ Server running successfully
2. ✅ API documentation accessible
3. 📝 Create a user via `/auth/register`
4. 🔐 Login via `/auth/login`
5. 🛍️ Start creating products (as seller)
6. 🎯 Test all endpoints via Swagger UI

## 💡 Tips

- Use Postman or Thunder Client for API testing
- Check `logs/` folder for application logs
- Use Swagger UI for interactive API testing
- Read JSDoc comments in code for detailed documentation
- Check `STRUCTURE.md` for complete project architecture

## 🆘 Need Help?

- Check logs in `logs/` directory
- Review error messages in console
- Verify all environment variables are set
- Ensure MongoDB is running
- Check API documentation at `/api-docs`

---

Happy Coding! 🚀
