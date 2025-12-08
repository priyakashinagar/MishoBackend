# Meesho Backend — API Documentation

Base URL (development): `http://localhost:5000`  
Swagger UI: `http://localhost:5000/api-docs`

## Authentication
- JWT required for protected routes. Add header: `Authorization: Bearer <token>`

---

## 📦 API Endpoints

### 🔐 Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/register` | Register new user | Public |
| POST | `/login` | Login user | Public |
| POST | `/logout` | Logout user | Private |
| GET | `/me` | Get current user | Private |
| POST | `/send-otp` | Send OTP to phone | Public |
| POST | `/verify-otp` | Verify OTP & login | Public |
| POST | `/refresh-token` | Refresh access token | Public |
| POST | `/forgot-password` | Request password reset | Public |

---

### 👤 Users (`/api/v1/users`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/profile` | Get user profile | Private |
| PUT | `/profile` | Update profile | Private |
| POST | `/addresses` | Add delivery address | Private |
| PUT | `/addresses/:addressId` | Update address | Private |
| DELETE | `/addresses/:addressId` | Delete address | Private |
| GET | `/orders` | Get user orders | Private |
| GET | `/wishlist` | Get wishlist | Private |

---

### 🛒 Cart (`/api/v1/cart`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/my` | Get user's cart | Private |
| POST | `/add` | Add item to cart | Private |
| PUT | `/update` | Update cart item quantity | Private |
| DELETE | `/remove/:productId` | Remove item from cart | Private |
| DELETE | `/clear` | Clear entire cart | Private |

**Add to Cart Request:**
```json
{
  "productId": "6925acb65db2d8764758ad81",
  "quantity": 2
}
```

---

### ❤️ Wishlist (`/api/v1/wishlist`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/my` | Get user's wishlist | Private |
| POST | `/add` | Add product to wishlist | Private |
| DELETE | `/remove/:productId` | Remove from wishlist | Private |
| GET | `/check/:productId` | Check if in wishlist | Private |
| POST | `/move-to-cart/:productId` | Move to cart | Private |

**Add to Wishlist Request:**
```json
{
  "productId": "6925acb65db2d8764758ad81"
}
```

---

### ⭐ Ratings (`/api/v1/rating`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/:productId` | Get product ratings | Public |
| POST | `/add` | Add rating/review | Private |
| PUT | `/update/:ratingId` | Update rating | Private |
| DELETE | `/delete/:ratingId` | Delete rating | Private |
| POST | `/helpful/:ratingId` | Mark as helpful | Private |
| GET | `/my/:productId` | Get your rating | Private |

**Add Rating Request:**
```json
{
  "productId": "6925acb65db2d8764758ad81",
  "rating": 4,
  "title": "Great product!",
  "review": "Excellent quality and fast delivery."
}
```

---

### 📦 Orders (`/api/v1/order`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/place` | Place new order | Private |
| GET | `/user` | Get user's orders | Private |
| GET | `/:orderId` | Get order by ID | Private |
| PUT | `/cancel/:orderId` | Cancel order | Private |
| POST | `/return/:orderId` | Request return | Private |
| GET | `/seller` | Get seller orders | Seller |
| GET | `/admin` | Get all orders | Admin |
| PUT | `/update/:orderId` | Update order status | Seller/Admin |

**Place Order Request:**
```json
{
  "shippingAddress": "123 Main Street, New Delhi, 110001",
  "paymentMethod": "cod"
}
```

Or with items (direct order):
```json
{
  "items": [
    { "productId": "...", "quantity": 2 }
  ],
  "shippingAddress": {
    "fullName": "John Doe",
    "phone": "9876543210",
    "addressLine1": "123 Main Street",
    "city": "New Delhi",
    "state": "Delhi",
    "pincode": "110001"
  },
  "paymentMethod": "upi"
}
```

---

### 🛍️ Products (`/api/v1/products`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Get all products | Public |
| GET | `/:id` | Get product by ID | Public |
| GET | `/featured` | Get featured products | Public |
| GET | `/seller/:sellerId` | Get seller products | Public |
| POST | `/` | Create product | Seller/Admin |
| PUT | `/:id` | Update product | Seller/Admin |
| DELETE | `/:id` | Delete product | Seller/Admin |

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `category` - Filter by category ID
- `search` - Search by name
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `sort` - Sort field

---

### 📁 Categories (`/api/v1/categories`)

**3-Level Hierarchy: Parent → Subcategory → Child**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Get all parent categories | Public |
| GET | `/:id` | Get category by ID | Public |
| GET | `/category/all` | Get all parent categories | Public |
| POST | `/category/add` | Add parent category | Admin |
| GET | `/subcategory/:categoryId` | Get subcategories | Public |
| POST | `/subcategory/add` | Add subcategory | Admin |
| GET | `/child-category/:subCategoryId` | Get child categories | Public |
| POST | `/child-category/add` | Add child category | Admin |
| PUT | `/:id` | Update category | Admin |
| DELETE | `/:id` | Delete category | Admin |

---

### 🏪 Sellers (`/api/v1/sellers`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/dashboard` | Get seller dashboard | Seller |
| GET | `/profile` | Get seller profile | Seller |
| PUT | `/profile` | Update profile | Seller |
| POST | `/kyc` | Submit KYC documents | Seller |
| POST | `/bank-details` | Add bank details | Seller |
| GET | `/products` | Get seller products | Seller |
| GET | `/orders` | Get seller orders | Seller |
| PUT | `/orders/:orderId/status` | Update order status | Seller |

---

### 💰 Earnings (`/api/v1/earnings`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/summary` | Get earnings summary | Seller/Admin |
| GET | `/detailed` | Get detailed earnings | Seller/Admin |
| GET | `/analytics` | Get earnings analytics | Seller/Admin |

---

### 👑 Admin (`/api/v1/admin`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/dashboard` | Get dashboard stats | Admin |
| GET | `/users` | Get all users | Admin |
| GET | `/users/:userId` | Get user by ID | Admin |
| PUT | `/users/:userId/status` | Update user status | Admin |
| GET | `/sellers` | Get all sellers | Admin |
| GET | `/sellers/:sellerId` | Get seller by ID | Admin |
| PUT | `/sellers/:sellerId/verify` | Verify seller KYC | Admin |
| PUT | `/sellers/:sellerId/status` | Update seller status | Admin |
| GET | `/products` | Get all products | Admin |
| DELETE | `/products/:productId` | Delete product | Admin |
| GET | `/orders` | Get all orders | Admin |
| GET | `/analytics` | Get platform analytics | Admin |

---

## 📝 Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [...]
}
```

---

## 🔧 Swagger Documentation

Interactive API docs available at: `http://localhost:5000/api-docs`

Features:
- Try out APIs directly from browser
- View request/response schemas
- Test with authentication
- Download OpenAPI spec

---

## 📱 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@meesho.com | admin123 |
| Seller | seller@meesho.com | seller123 |
| User | user@meesho.com | user123 |