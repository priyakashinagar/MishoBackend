# Seller Product Flow - Complete Documentation

## 1. Seller Adds Product (Seller Panel)

**Location:** `AdminPannal/MeshoAdminPanal/src/sellerAdminPanal/AddProduct.jsx`

**Backend:** `productController.createProduct()` - Lines 50-67
- Automatically finds seller ID from logged-in user
- Sets `seller: sellerId` and `sellerModel: 'Seller'`

```javascript
if (req.user.role === 'seller') {
  const seller = await Seller.findOne({ user: req.user._id });
  sellerId = seller._id;
}
```

---

## 2. Product Shows on Website with Store Info

**Location:** `UserWebsite/MeeshoUserPannal/src/pages/ProductPage.jsx`

**Backend:** `productController.getProductById()` - Lines 343-370
- Populates seller information
- Formats seller data for both User and Seller models

**Frontend Display:**
- Store name: `product.seller.shopName`
- "View Shop" button navigates to `/seller/{sellerId}`

---

## 3. User Purchases Product

**Location:** `UserWebsite/MeeshoUserPannal/src/pages/Payment.jsx`

**Backend:** `orderController.placeOrder()` - Lines 72-130

### Cart Orders (Line 89):
```javascript
orderItems.push({
  product: product._id,
  seller: sellerId  // ✅ Seller ID saved
});
```

### Direct Orders (Line 118):
```javascript
orderItems.push({
  product: product._id,
  seller: sellerId  // ✅ Seller ID saved
});
```

---

## 4. Order Shows in Seller Panel

**Location:** `AdminPannal/MeshoAdminPanal/src/sellerAdminPanal/AllOrders.jsx`

**Backend:** `sellerController.getOrders()` - Line 317
```javascript
const query = { 'items.seller': seller._id };
```

**Result:** Only orders containing this seller's products are shown

---

## 5. Revenue Goes to Seller

**Backend:** `orderController.placeOrder()` - After order creation

Order document structure:
```javascript
{
  items: [
    {
      product: ObjectId,
      seller: ObjectId,  // ✅ Seller gets identified
      price: Number,
      quantity: Number
    }
  ],
  pricing: {
    total: Number
  }
}
```

Revenue tracking in `sellerController.getDashboard()`:
```javascript
const revenueData = await Order.aggregate([
  { $match: { 'items.seller': seller._id, status: 'delivered' } },
  { $group: { _id: null, total: { $sum: '$pricing.total' } } }
]);
```

---

## Current Status: ✅ FULLY IMPLEMENTED

### What's Working:
1. ✅ Seller adds product → Seller ID auto-saved
2. ✅ Product shows on website with store info
3. ✅ Order placement saves seller ID
4. ✅ Seller panel filters orders by seller ID
5. ✅ Revenue tracked per seller

### To Test:
1. Login as seller (phone: 8888888888, OTP: 999000)
2. Add a product from seller panel
3. Check product on user website - store name visible
4. Place order as user
5. Check seller panel - order should appear

---

## Database Schema

### Product Model:
```javascript
{
  seller: ObjectId,  // References User or Seller
  sellerModel: String  // 'User' or 'Seller'
}
```

### Order Model:
```javascript
{
  items: [{
    product: ObjectId,
    seller: ObjectId,  // ✅ Critical for seller filtering
    price: Number
  }]
}
```

### Seller Model:
```javascript
{
  user: ObjectId,  // References User
  shopName: String,
  stats: {
    totalRevenue: Number,
    totalOrders: Number
  }
}
```
